import { makeIncArray, NumberRange, TSciChart, XyDataSeries } from "scichart";

import { ChartOptionsDataGeneratorType, ChartOptionsDataTypeEnum, ChartOptionsAutoUpdateTypeEnum } from './chart-options.service';
import { eegFixedData01 } from './eegfixeddata01';

type ChartOptionsXyDataSeriesType = {
    containsNaN: boolean;
    dataEvenlySpaced: boolean;
    dataIsSortedInX: boolean;
    fifoTimescaleCapacity: number;
    fifoTotalCapacity: number;
    fifoSweeping: boolean;
    streamData: boolean;
    xAxisDensity: number;
    yAxisAmplitude: number;
}

type ChartXyDataSeriesAnnotationType = {
    x: number;
    y: number;
}

interface ChartXyDataSeriesInterface {
    get annotations(): ChartXyDataSeriesAnnotationType[];
    autoUpdateDataRange(rangeCount: number): void;
}

abstract class ChartXyDataSeriesInterfaceAbstractClass implements ChartXyDataSeriesInterface {
    constructor(protected _xyDataSeries: XyDataSeries, protected _optionsXyDataSeries: ChartOptionsXyDataSeriesType, ...args: any[]) {}
    get annotations(): ChartXyDataSeriesAnnotationType[] { return []; }
    abstract autoUpdateDataRange(rangeCount: number): void;
}

abstract class ChartXyDataSeriesAbstractClass extends XyDataSeries implements ChartXyDataSeriesInterface {
    protected _interface!: ChartXyDataSeriesInterface;

    constructor(protected _wasmContext: TSciChart, protected _optionsXyDataSeries: ChartOptionsXyDataSeriesType, ...args: any[]) {
        // Create an empty FIFO series
	// When data reaches fifoTotalCapacity then old samples will be pushed and new samples appended to the end
        // super(_wasmContext, { containsNaN: true, dataIsSortedInX: true, dataEvenlySpacedInX: true, fifoCapacity: _fifoCapacity, fifoSweeping: true });
        super(_wasmContext, {
	    containsNaN: _optionsXyDataSeries.containsNaN,
	    dataIsSortedInX: _optionsXyDataSeries.dataIsSortedInX,
	    dataEvenlySpacedInX: _optionsXyDataSeries.dataIsSortedInX,
	    fifoCapacity: _optionsXyDataSeries.fifoTotalCapacity,
	    fifoSweeping: _optionsXyDataSeries.fifoSweeping
	});

        // Fill with NaN values up to fifoTotalCapacity
	// This stops the stretching effect when Fifo series are filled with AutoRange
	this.appendRange(Array(_optionsXyDataSeries.fifoTotalCapacity).fill(NaN), Array(_optionsXyDataSeries.fifoTotalCapacity).fill(NaN));
    }

    get annotations(): ChartXyDataSeriesAnnotationType[] { return this._interface.annotations; }

    get optionsXyDataSeries(): ChartOptionsXyDataSeriesType { return this._optionsXyDataSeries; }

    autoUpdateDataRange(rangeCount: number): void { return this._interface.autoUpdateDataRange(rangeCount); }
}

export let globalChartXyDataSeriesArray!: ChartXyDataSeriesArray;

export class ChartXyDataSeriesArray extends Array<ChartXyDataSeries> {
    dataSeries: ChartXyDataSeries[] = [];

    private _autoUpdateCallback!: (visibleRange: NumberRange) => void;
    private _intervalId: ReturnType<typeof setInterval> | undefined = undefined;
    protected _visibleRange: NumberRange = new NumberRange(0, 0);
    protected _visibleRangeOffsetIndex: { min: number, max: number } | undefined = undefined;

    constructor(private _wasmContext: TSciChart, private _arrayLength: number, private _optionsDataGenerator: ChartOptionsDataGeneratorType, private _autoUpdateData: boolean = true) {
	super();
	globalChartXyDataSeriesArray = this;

	// Create the data genereators for the XyDataSeries that matches the Chart Options dataGenerator dataType setting
	this._createDataGenerators();

	// Automatically update the data with the data generator if the autoUpdateData flag is true
	if (_autoUpdateData) {
	    // Update the data at least one time whether or not the dataGenerator autoUpdateType is Static/Dynamic/Streaming
	    // Auto update data for the entire XyDataSeries FIFO for all data types so that the initial lines fill the entire graph
	    for (let i = 0 ; i < this._optionsDataGenerator.fifoTimescale ; i++) {
		this._updateDataNow(this[i].optionsXyDataSeries.fifoTimescaleCapacity);
	    }

	    // If it is static then auto update data for the entire XyDataSeries FIFO, otherwise draw all data on a auto update timer
	    const staticData = this._optionsDataGenerator.autoUpdateType === ChartOptionsAutoUpdateTypeEnum.Static;
	    if (!staticData) {
		this._autoUpdateDataRangeTimer();
	    }
	}
    }

    get annotations(): ChartXyDataSeriesAnnotationType[] {
	if (this.length > 0) {
	    return this[0].annotations;
	}
	else {
	    return [];
	}
    }

    get visibleRange(): NumberRange { return this._visibleRange; }

    set visibleRange(visibleRange: NumberRange) {
	let xyDataSeries = this[0];
	this._visibleRange = visibleRange;
	this._visibleRangeOffsetIndex = { min: xyDataSeries.findIndex(visibleRange.min), max: xyDataSeries.findIndex(visibleRange.max) };
	if (this._autoUpdateCallback !== undefined) {
	    this._autoUpdateCallback(this._visibleRange);
	}
    }

    set autoUpdateCallback(autoUpdateCallback: (visibleRange: NumberRange) => void) {
	this._autoUpdateCallback = autoUpdateCallback;
    }

    _autoUpdateDataRangeTimer(): void {
	let scaleUpdateRate = this._optionsDataGenerator.autoUpdateTimescale < 1.0 ? 1.0 / this._optionsDataGenerator.autoUpdateTimescale : 1.0;
	let autoUpdateRange = (1000 / this._optionsDataGenerator.autoUpdateRateMsec) / this._optionsDataGenerator.xAxisDensity * this._optionsDataGenerator.autoUpdateTimescale * scaleUpdateRate;
	this._intervalId = setInterval(() => { this._updateDataNow(autoUpdateRange); }, this._optionsDataGenerator.autoUpdateRateMsec * scaleUpdateRate);
    }

    _createDataGenerators(): void {
	// Create the data genereators for the ChartXyDataSeries array
	for (let i = 0; i < this._arrayLength ; i++) {
	    this[i] = new ChartXyDataSeries(this._wasmContext, this._optionsDataGenerator, false);
	}
    }

    _updateDataNow(rangeCount: number): void {
	let xyDataSeries = this[0];
	if (xyDataSeries === undefined || xyDataSeries.getNativeXValues() === undefined) {
	    clearInterval(this._intervalId);
	    this._intervalId = undefined;
	    return;
	}
	for (let i = 0 ; i < this._arrayLength ; i++) {
	    this[i].autoUpdateDataRange(rangeCount);	    
	}
	this._updateVisibleRange();
	if (this._autoUpdateCallback !== undefined) {
	    this._autoUpdateCallback(this._visibleRange);
	}
    }

    _updateVisibleRange(): void {
	// Check to see if the Visible Range was changed from the overview panel
	// If the _visibleRangeOffsetIndex is set then use it to determine where the next visibleRange should be set, this happens when the overview panel is updated
	if (this._visibleRangeOffsetIndex !== undefined) {
	    let xyDataSeries = this[0];
	    if (xyDataSeries.getNativeXValues() === undefined) { console.log("xyDataSeries.getNativeXValues: ", xyDataSeries.getNativeXValues); return; }
	    let fifoTimescaleTailStartIndex = xyDataSeries.getNativeXValues().get(this._visibleRangeOffsetIndex.min);
	    let fifoTimescaleTailEndIndex = xyDataSeries.getNativeXValues().get(this._visibleRangeOffsetIndex.max);
	    this._visibleRange = new NumberRange(fifoTimescaleTailStartIndex, fifoTimescaleTailEndIndex);
	}
	// Update the visibleRange of the first xAxis to match the FifoTimescale to visualize a single timescale
	else {
	    let xyDataSeries = this[0];
	    let fifoTimescaleTailStartIndex = xyDataSeries.getNativeXValues().get(xyDataSeries.count() / this._optionsDataGenerator.fifoTimescale);
	    let fifoTimescaleTailEndIndex = xyDataSeries.getNativeXValues().get(xyDataSeries.count() - 1);
	    this._visibleRange = new NumberRange(fifoTimescaleTailStartIndex, fifoTimescaleTailEndIndex);
	}
    }
}

export class ChartXyDataSeries extends ChartXyDataSeriesAbstractClass implements ChartXyDataSeriesInterface {
    public xyDataSeries: XyDataSeries = this;

    private _intervalId: ReturnType<typeof setInterval> | undefined = undefined;

    static XyGeneratorOptions(optionsDataGenerator: ChartOptionsDataGeneratorType): ChartOptionsXyDataSeriesType {
        // super(_wasmContext, { containsNaN: true, dataIsSortedInX: true, dataEvenlySpacedInX: true, fifoCapacity: _fifoCapacity, fifoSweeping: true });
	const fifoTimescaleCapacity = optionsDataGenerator.dataType === "EegFixedData" ? eegFixedData01.length - 1 : optionsDataGenerator.fifoTotalLength;
	const fifoTotalCapacity = fifoTimescaleCapacity * optionsDataGenerator.fifoTimescale;
	const streamData = optionsDataGenerator.autoUpdateType === ChartOptionsAutoUpdateTypeEnum.Stream;
	let optionsXyDataSeries: ChartOptionsXyDataSeriesType = {
	    containsNaN: true,
	    dataEvenlySpaced: true,
	    dataIsSortedInX: true,
	    fifoTimescaleCapacity: fifoTimescaleCapacity,
	    fifoTotalCapacity: fifoTotalCapacity,
	    fifoSweeping: true,
	    streamData: streamData,
	    xAxisDensity: 20,
	    yAxisAmplitude: 1
	}
	return optionsXyDataSeries;
    }

    constructor(_wasmContext: TSciChart, private _optionsDataGenerator: ChartOptionsDataGeneratorType, autoUpdateData: boolean = true) {
	// Use the XyGeneratorOptions to set the ChartOptionsXyDataSeriesType options
	super(_wasmContext, ChartXyDataSeries.XyGeneratorOptions(_optionsDataGenerator));
	
	// Create the data genereator for the XyDataSeries that matches the Chart Options dataGenerator dataType setting
	this._createDataGenerator();

	// Automatically update the data with the data generator if the autoUpdateData flag is true
	if (autoUpdateData) {
	    // Update the data at least one time whether or not the dataGenerator autoUpdateType is Static/Dynamic/Streaming
	    // Auto update data for the entire XyDataSeries FIFO for all data types so that the initial lines fill the entire graph
	    for (let i = 0 ; i < this._optionsDataGenerator.fifoTimescale ; i++) {
		this._updateDataNow(this._optionsXyDataSeries.fifoTimescaleCapacity);
	    }

	    // If it is static then auto update data for the entire XyDataSeries FIFO, otherwise draw all data on a auto update timer
	    const staticData = this._optionsDataGenerator.autoUpdateType === ChartOptionsAutoUpdateTypeEnum.Static;
	    if (!staticData) {
		this._autoUpdateDataRangeTimer();
	    }
	}
    }
    
    _autoUpdateDataRangeTimer(): void {
	let scaleUpdateRate = this._optionsDataGenerator.autoUpdateTimescale < 1.0 ? 1.0 / this._optionsDataGenerator.autoUpdateTimescale : 1.0;
	let autoUpdateRange = (1000 / this._optionsDataGenerator.autoUpdateRateMsec) / this._optionsDataGenerator.xAxisDensity * this._optionsDataGenerator.autoUpdateTimescale * scaleUpdateRate;
	this._intervalId = setInterval(() => { this._updateDataNow(autoUpdateRange); }, this._optionsDataGenerator.autoUpdateRateMsec * scaleUpdateRate);
    }

    _createDataGenerator(): void {
	// Create the data genereator for the XyDataSeries that matches the Chart Options dataGenerator dataType setting
	if (this._optionsDataGenerator.dataType === ChartOptionsDataTypeEnum.SineWave) {
	    this._interface = new SineWaveXyDataSeriesInterface(this, this._optionsXyDataSeries, 3.5);
	}
	if (this._optionsDataGenerator.dataType === ChartOptionsDataTypeEnum.RandomData) {
	    this._interface = new RandomDataXyDataSeriesInterface(this, this._optionsXyDataSeries);
	}
	if (this._optionsDataGenerator.dataType === ChartOptionsDataTypeEnum.RandomWalk) {
	    this._interface = new RandomWalkXyDataSeriesInterface(this, this._optionsXyDataSeries);
	}
	if (this._optionsDataGenerator.dataType === ChartOptionsDataTypeEnum.EegFixedData) {
	    this._interface = new EegFixedDataXyDataSeriesInterface(this, this._optionsXyDataSeries);
	}
    }

    _updateDataNow(rangeCount: number): void {
	if (this.xyDataSeries === undefined) {
	    clearInterval(this._intervalId);
	    this._intervalId = undefined;
	    return;
	}
	this.autoUpdateDataRange(rangeCount);
    }
}

class SineWaveXyDataSeriesInterface extends ChartXyDataSeriesInterfaceAbstractClass {
    private _totalRangeCount: number = 0;

    constructor (_xyDataSeries: XyDataSeries, _optionsXyDataSeries: ChartOptionsXyDataSeriesType, private _numberWaves: number) {
	super(_xyDataSeries, _optionsXyDataSeries);
    }

    override get annotations(): ChartXyDataSeriesAnnotationType[] { return [{x: 100.0 / 3.5, y: 15}, {x: 100.0 / 3.5 * 2, y: 15}, {x: 100.0 / 3.5 * 3, y: 15}]; }

    autoUpdateDataRange(rangeCount: number): void {
	let xAxisOffset = this._optionsXyDataSeries.streamData ? this._totalRangeCount : this._totalRangeCount % this._optionsXyDataSeries.fifoTotalCapacity;
	this._xyDataSeries.appendRange(
	    Array.from(makeIncArray(rangeCount), (x: number) => (x + xAxisOffset) / this._optionsXyDataSeries.xAxisDensity),
	    Array.from(
		makeIncArray(rangeCount),
		(x: number) => Math.sin((2 * Math.PI * this._numberWaves) * ((x + this._totalRangeCount) / this._optionsXyDataSeries.fifoTotalCapacity) * this._optionsXyDataSeries.yAxisAmplitude)
	    )
	);
	this._totalRangeCount = this._totalRangeCount + rangeCount;
    }
}

export class SineWaveXyDataSeries extends ChartXyDataSeriesAbstractClass {
    constructor(_wasmContext: TSciChart, _optionsXyDataSeries: ChartOptionsXyDataSeriesType, _numberWaves: number) {
	super(_wasmContext, _optionsXyDataSeries, _numberWaves);
	this._interface = new SineWaveXyDataSeriesInterface(this, _optionsXyDataSeries, _numberWaves);
    }
}

class RandomDataXyDataSeriesInterface extends ChartXyDataSeriesInterfaceAbstractClass {
    private _totalRangeCount: number = 0;

    constructor (_xyDataSeries: XyDataSeries, _optionsXyDataSeries: ChartOptionsXyDataSeriesType) {
	super(_xyDataSeries, _optionsXyDataSeries);
    }

    autoUpdateDataRange(rangeCount: number): void {
	let xAxisOffset = this._optionsXyDataSeries.streamData ? this._totalRangeCount : this._totalRangeCount % this._optionsXyDataSeries.fifoTotalCapacity;
	this._xyDataSeries.appendRange(
	    Array.from(makeIncArray(rangeCount), (x: number) => (x + xAxisOffset) / this._optionsXyDataSeries.xAxisDensity),
	    Array.from(
		makeIncArray(rangeCount),
		(x: number) => Math.random() - 0.5 * this._optionsXyDataSeries.yAxisAmplitude
	    )
	);
	this._totalRangeCount = this._totalRangeCount + rangeCount;
    }
}

export class RandomDataXyDataSeries extends ChartXyDataSeriesAbstractClass {
    constructor(_wasmContext: TSciChart, _optionsXyDataSeries: ChartOptionsXyDataSeriesType) {
	super(_wasmContext, _optionsXyDataSeries);
	this._interface = new RandomDataXyDataSeriesInterface(this, _optionsXyDataSeries);
    }
}

class RandomWalkXyDataSeriesInterface extends ChartXyDataSeriesInterfaceAbstractClass {
    private _totalRangeCount: number = 0;
    private _lastRandomWalk: number = 0;

    constructor (_xyDataSeries: XyDataSeries, _optionsXyDataSeries: ChartOptionsXyDataSeriesType) {
	super(_xyDataSeries, _optionsXyDataSeries);
    }

    autoUpdateDataRange(rangeCount: number): void {
	let xAxisOffset = this._optionsXyDataSeries.streamData ? this._totalRangeCount : this._totalRangeCount % this._optionsXyDataSeries.fifoTotalCapacity;
	this._xyDataSeries.appendRange(
	    Array.from(makeIncArray(rangeCount), (x: number) => (x + xAxisOffset) / this._optionsXyDataSeries.xAxisDensity),
	    Array.from(
		makeIncArray(rangeCount),
		(x: number) => {
		    if (this._lastRandomWalk > 0.8 * this._optionsXyDataSeries.yAxisAmplitude) {
			const random = (Math.random() - 0.7);
			const step = random > 0 ? random * 0.01 : random * 0.04;
			this._lastRandomWalk = this._lastRandomWalk + step;
		    }
		    else if (this._lastRandomWalk < 0.8 * -this._optionsXyDataSeries.yAxisAmplitude) {
			const random = (Math.random() - 0.3);
			const step = random < 0 ? random * 0.01 : random * 0.04;
			this._lastRandomWalk = this._lastRandomWalk + step;
		    }
		    else {
			const step = (Math.random() - 0.5) * 0.04;
			this._lastRandomWalk = this._lastRandomWalk + step;
		    }
		    return this._lastRandomWalk;
		})
	);
	this._totalRangeCount = this._totalRangeCount + rangeCount;
    }
}

export class RandomWalkXyDataSeries extends ChartXyDataSeriesAbstractClass {
    constructor(_wasmContext: TSciChart, _optionsXyDataSeries: ChartOptionsXyDataSeriesType) {
	super(_wasmContext, _optionsXyDataSeries);
	this._interface = new RandomWalkXyDataSeriesInterface(this, _optionsXyDataSeries);
    }
}

class EegFixedDataXyDataSeriesInterface extends ChartXyDataSeriesInterfaceAbstractClass {
    private _eegFixedDataMaxX: number = -1000;
    private _eegFixedDataMinY: number = 1000;
    private _eegFixedDataMaxY: number = 0;
    private _eegFixedDataOffsetX: number = 0;
    private _eegFixedDataOffsetY: number = 0;
    private _scaleXAxis: number = 1.0;
    private _scaleYAxis: number = 1.0
    private _totalRangeCount: number = 0;

    constructor (_xyDataSeries: XyDataSeries, _optionsXyDataSeries: ChartOptionsXyDataSeriesType) {
	super(_xyDataSeries, _optionsXyDataSeries);
	for (let i = 0; i < eegFixedData01.length ; i++) {
	    if (eegFixedData01[i][0] > this._eegFixedDataMaxX) { this._eegFixedDataMaxX = eegFixedData01[i][0]; }
	    if (eegFixedData01[i][1] > this._eegFixedDataMaxY) { this._eegFixedDataMaxY = eegFixedData01[i][1]; }
	    if (eegFixedData01[i][1] < this._eegFixedDataMinY) { this._eegFixedDataMinY = eegFixedData01[i][1]; }
	    this._eegFixedDataOffsetY = -this._eegFixedDataMinY - (this._eegFixedDataMaxY - this._eegFixedDataMinY) / 2;
	}
	this._scaleXAxis = 100.0 / this._eegFixedDataMaxX;
	this._scaleYAxis = this._optionsXyDataSeries.yAxisAmplitude / -75.0;
    }

    override get annotations(): ChartXyDataSeriesAnnotationType[] { return [{x: 44.5, y: 15}]; }

    autoUpdateDataRange(rangeCount: number): void {
	let xAxisOffset = this._optionsXyDataSeries.streamData ? this._totalRangeCount : this._totalRangeCount % this._optionsXyDataSeries.fifoTotalCapacity;
	if (xAxisOffset + rangeCount >= eegFixedData01.length) {
	    xAxisOffset = 0;
	    this._eegFixedDataOffsetX = this._eegFixedDataOffsetX + eegFixedData01[this._totalRangeCount][0];
	    this._totalRangeCount = 0;
	};
	this._xyDataSeries.appendRange(
	    Array.from(makeIncArray(rangeCount), (x: number) => (eegFixedData01[x + xAxisOffset][0] + this._eegFixedDataOffsetX) * this._scaleXAxis),
	    Array.from(makeIncArray(rangeCount), (x: number) => (eegFixedData01[x + xAxisOffset][1] + this._eegFixedDataOffsetY) * this._scaleYAxis)
	);
	this._totalRangeCount = this._totalRangeCount + rangeCount;
    }
}

export class EegFixedDataXyDataSeries extends ChartXyDataSeriesAbstractClass {
    constructor(_wasmContext: TSciChart, _optionsXyDataSeries: ChartOptionsXyDataSeriesType) {
	super(_wasmContext, _optionsXyDataSeries);
	this._interface = new EegFixedDataXyDataSeriesInterface(this, _optionsXyDataSeries);
    }
}
