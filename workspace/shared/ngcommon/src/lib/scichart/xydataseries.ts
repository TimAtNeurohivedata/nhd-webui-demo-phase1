import { makeIncArray, TSciChart, XyDataSeries } from "scichart";

import { ChartOptionsDataGeneratorType, ChartOptionsDataTypeEnum, ChartOptionsAutoUpdateTypeEnum } from './chart-options.service';
import { eegFixedData01 } from './eegfixeddata01';

type ChartOptionsXyDataSeriesType = {
    containsNaN: boolean;
    dataEvenlySpaced: boolean;
    dataIsSortedInX: boolean;
    fifoCapacity: number;
    fifoSweeping: boolean;
    streamData: boolean;
    xAxisDensity: number;
    yAxisAmplitude: number;
}

interface ChartXyDataSeriesInterface {
    autoUpdateDataRange(rangeCount: number): void;
}

abstract class ChartXyDataSeriesInterfaceAbstractClass implements ChartXyDataSeriesInterface {
    constructor(protected _xyDataSeries: XyDataSeries, protected _optionsXyDataSeries: ChartOptionsXyDataSeriesType, ...args: any[]) {}
    abstract autoUpdateDataRange(rangeCount: number): void;
}

abstract class ChartXyDataSeriesAbstractClass extends XyDataSeries implements ChartXyDataSeriesInterface {
    protected _interface!: ChartXyDataSeriesInterface;

    constructor(protected _wasmContext: TSciChart, protected _optionsXyDataSeries: ChartOptionsXyDataSeriesType, ...args: any[]) {
        // Create an empty FIFO series
	// When data reaches _fifoCapacity then old samples will be pushed and new samples appended to the end
        // super(_wasmContext, { containsNaN: true, dataIsSortedInX: true, dataEvenlySpacedInX: true, fifoCapacity: _fifoCapacity, fifoSweeping: true });
        super(_wasmContext, {
	    containsNaN: _optionsXyDataSeries.containsNaN,
	    dataIsSortedInX: _optionsXyDataSeries.dataIsSortedInX,
	    dataEvenlySpacedInX: _optionsXyDataSeries.dataIsSortedInX,
	    fifoCapacity: _optionsXyDataSeries.fifoCapacity,
	    fifoSweeping: _optionsXyDataSeries.fifoSweeping
	});

        // Fill with NaN values up to _fifoCapacity
	// This stops the stretching effect when Fifo series are filled with AutoRange
	this.appendRange(Array(_optionsXyDataSeries.fifoCapacity).fill(NaN), Array(_optionsXyDataSeries.fifoCapacity).fill(NaN));
    }

    autoUpdateDataRange(rangeCount: number): void { return this._interface.autoUpdateDataRange(rangeCount); }
}

export class ChartXyDataSeriesArray extends Array<ChartXyDataSeries> {
    dataSeries: ChartXyDataSeries[] = [];

    private _intervalId: ReturnType<typeof setInterval> | undefined = undefined;
    
    constructor(private _wasmContext: TSciChart, private _arrayLength: number, private _optionsDataGenerator: ChartOptionsDataGeneratorType, private _autoUpdateData: boolean = true) {
	super();

	// Create the data genereators for the XyDataSeries that matches the Chart Options dataGenerator dataType setting
	this._createDataGenerators();
	
	// Automatically update the data with the data generator if the autoUpdateData flag is true
	if (_autoUpdateData) {
	    // Update the data at least one time whether or not the dataGenerator autoUpdateType is Static/Dynamic/Streaming
	    // If it is static then auto update data for the entire XyDataSeries FIFO, otherwise draw all data on a auto update timer
	    const staticData = this._optionsDataGenerator.autoUpdateType === ChartOptionsAutoUpdateTypeEnum.Static;
	    if (staticData) {
		this._updateDataNow(this._optionsDataGenerator.fifoTotalLength);
	    }
	    else {
		this._autoUpdateDataRangeTimer();
	    }
	}
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
	if (this[0].xyDataSeries === undefined) {
	    clearInterval(this._intervalId);
	    this._intervalId = undefined;
	    return;
	}
	for (let i = 0 ; i < this._arrayLength ; i++) {
	    this[i].autoUpdateDataRange(rangeCount);	    
	}
    }
}

export class ChartXyDataSeries extends ChartXyDataSeriesAbstractClass implements ChartXyDataSeriesInterface {
    public xyDataSeries: XyDataSeries = this;

    private _intervalId: ReturnType<typeof setInterval> | undefined = undefined;

    static XyGeneratorOptions(optionsDataGenerator: ChartOptionsDataGeneratorType): ChartOptionsXyDataSeriesType {
        // super(_wasmContext, { containsNaN: true, dataIsSortedInX: true, dataEvenlySpacedInX: true, fifoCapacity: _fifoCapacity, fifoSweeping: true });
	const fifoCapacity = optionsDataGenerator.dataType === "EegFixedData" ? eegFixedData01.length - 1 : optionsDataGenerator.fifoTotalLength;
	optionsDataGenerator.fifoTotalLength = fifoCapacity;
	const streamData = optionsDataGenerator.autoUpdateType === ChartOptionsAutoUpdateTypeEnum.Stream;
	let optionsXyDataSeries: ChartOptionsXyDataSeriesType = {
	    containsNaN: true, dataEvenlySpaced: true, dataIsSortedInX: true, fifoCapacity: fifoCapacity, fifoSweeping: true, streamData: streamData, xAxisDensity: 20, yAxisAmplitude: 1
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
	    // If it is static then auto update data for the entire XyDataSeries FIFO, otherwise draw all data on a auto update timer
	    const staticData = this._optionsDataGenerator.autoUpdateType === ChartOptionsAutoUpdateTypeEnum.Static;
	    if (staticData) {
		this._updateDataNow(this._optionsDataGenerator.fifoTotalLength);
	    }
	    else {
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
	    this.autoUpdateDataRange(this._optionsDataGenerator.fifoTotalLength);
	}
	if (this._optionsDataGenerator.dataType === ChartOptionsDataTypeEnum.RandomData) {
	    this._interface = new RandomDataXyDataSeriesInterface(this, this._optionsXyDataSeries);
	    this.autoUpdateDataRange(this._optionsDataGenerator.fifoTotalLength);
	}
	if (this._optionsDataGenerator.dataType === ChartOptionsDataTypeEnum.RandomWalk) {
	    this._interface = new RandomWalkXyDataSeriesInterface(this, this._optionsXyDataSeries);
	    this.autoUpdateDataRange(this._optionsDataGenerator.fifoTotalLength);
	}
	if (this._optionsDataGenerator.dataType === ChartOptionsDataTypeEnum.EegFixedData) {
	    this._interface = new EegFixedDataXyDataSeriesInterface(this, this._optionsXyDataSeries);
	    this.autoUpdateDataRange(this._optionsDataGenerator.fifoTotalLength);
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

class SineWaveXyDataSeriesInterface implements ChartXyDataSeriesInterface {
    private _totalRangeCount: number = 0;

    constructor (private _xyDataSeries: XyDataSeries, private _optionsXyDataSeries: ChartOptionsXyDataSeriesType, private _numberWaves: number) {}

    autoUpdateDataRange(rangeCount: number): void {
	let xAxisOffset = this._optionsXyDataSeries.streamData ? this._totalRangeCount : this._totalRangeCount % this._optionsXyDataSeries.fifoCapacity;
	this._xyDataSeries.appendRange(
	    Array.from(makeIncArray(rangeCount), (x: number) => (x + xAxisOffset) / this._optionsXyDataSeries.xAxisDensity),
	    Array.from(
		makeIncArray(rangeCount),
		(x: number) => Math.sin((2 * Math.PI * this._numberWaves) * ((x + this._totalRangeCount) / this._optionsXyDataSeries.fifoCapacity) * this._optionsXyDataSeries.yAxisAmplitude)
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

class RandomDataXyDataSeriesInterface implements ChartXyDataSeriesInterface {
    private _totalRangeCount: number = 0;

    constructor (private _xyDataSeries: XyDataSeries, private _optionsXyDataSeries: ChartOptionsXyDataSeriesType) {}

    autoUpdateDataRange(rangeCount: number): void {
	let xAxisOffset = this._optionsXyDataSeries.streamData ? this._totalRangeCount : this._totalRangeCount % this._optionsXyDataSeries.fifoCapacity;
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

class RandomWalkXyDataSeriesInterface implements ChartXyDataSeriesInterface {
    private _totalRangeCount: number = 0;
    private _lastRandomWalk: number = 0;

    constructor (private _xyDataSeries: XyDataSeries, private _optionsXyDataSeries: ChartOptionsXyDataSeriesType) {}

    autoUpdateDataRange(rangeCount: number): void {
	let xAxisOffset = this._optionsXyDataSeries.streamData ? this._totalRangeCount : this._totalRangeCount % this._optionsXyDataSeries.fifoCapacity;
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

    autoUpdateDataRange(rangeCount: number): void {
	let xAxisOffset = this._optionsXyDataSeries.streamData ? this._totalRangeCount : this._totalRangeCount % this._optionsXyDataSeries.fifoCapacity;
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
