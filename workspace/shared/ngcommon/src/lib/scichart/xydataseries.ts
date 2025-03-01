import { makeIncArray, TSciChart, XyDataSeries } from "scichart";

import { ChartOptionsDataGeneratorType, ChartOptionsDataTypeEnum, ChartOptionsAutoUpdateTypeEnum } from './chart-options.service';
import { eegFixedData01 } from './eegfixeddata01';

interface ChartXyDataSeriesInterface {
    autoUpdateDataRange(rangeCount: number): void;
}

abstract class ChartXyDataSeriesAbstractClass extends XyDataSeries implements ChartXyDataSeriesInterface {
    protected _interface!: ChartXyDataSeriesInterface;

    constructor(protected _wasmContext: TSciChart, private _fifoCapacity: number, private _density: number, private _amplitude: number, private _streamData: boolean, ...args: any[]) {
        // Create an empty FIFO series
	// When data reaches _fifoCapacity then old samples will be pushed and new samples appended to the end
        super(_wasmContext, { containsNaN: true, dataIsSortedInX: true, dataEvenlySpacedInX: true, fifoCapacity: _fifoCapacity, fifoSweeping: true });

        // Fill with NaN values up to _fifoCapacity
	// This stops the stretching effect when Fifo series are filled with AutoRange
	this.appendRange(Array(_fifoCapacity).fill(NaN), Array(_fifoCapacity).fill(NaN));
    }

    autoUpdateDataRange(rangeCount: number): void { return this._interface.autoUpdateDataRange(rangeCount); }
}

export class ChartXyDataSeriesArray extends Array<ChartXyDataSeries> {
    dataSeries: ChartXyDataSeries[] = [];

    private _intervalId: ReturnType<typeof setInterval> | undefined = undefined;
    
    constructor(private _wasmContext: TSciChart, private _arrayLength: number, private _options: ChartOptionsDataGeneratorType, private _autoUpdateData: boolean = true) {
	super();

	// Create the data genereators for the XyDataSeries that matches the Chart Options dataGenerator dataType setting
	this._createDataGenerators();
	
	// Automatically update the data with the data generator if the autoUpdateData flag is true
	if (_autoUpdateData) {
	    // Update the data at least one time whether or not the dataGenerator autoUpdateType is Static/Dynamic/Streaming
	    // If it is static then auto update data for the entire XyDataSeries FIFO, otherwise draw all data on a auto update timer
	    const staticData = this._options.autoUpdateType === ChartOptionsAutoUpdateTypeEnum.Static;
	    if (staticData) {
		this._updateDataNow(this._options.fifoTotalLength);
	    }
	    else {
		this._autoUpdateDataRangeTimer();
	    }
	}
    }

    _autoUpdateDataRangeTimer(): void {
	let scaleUpdateRate = this._options.autoUpdateSpeed < 1.0 ? 1.0 / this._options.autoUpdateSpeed : 1.0;
	let autoUpdateRange = (1000 / this._options.autoUpdateRateMsec) / this._options.xAxisDensity * this._options.autoUpdateSpeed * scaleUpdateRate;
	this._intervalId = setInterval(() => { this._updateDataNow(autoUpdateRange); }, this._options.autoUpdateRateMsec * scaleUpdateRate);
    }

    _createDataGenerators(): void {
	// Create the data genereators for the ChartXyDataSeries array
	for (let i = 0; i < this._arrayLength ; i++) {
	    this[i] = new ChartXyDataSeries(this._wasmContext, this._options, false);
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

    constructor(_wasmContext: TSciChart, private _options: ChartOptionsDataGeneratorType, autoUpdateData: boolean = true) {
	super(_wasmContext, _options.fifoTotalLength, _options.xAxisDensity, _options.yAxisAmplitude, true);
	
	// Create the data genereator for the XyDataSeries that matches the Chart Options dataGenerator dataType setting
	this._createDataGenerator();
	
	// Automatically update the data with the data generator if the autoUpdateData flag is true
	if (autoUpdateData) {
	    // Update the data at least one time whether or not the dataGenerator autoUpdateType is Static/Dynamic/Streaming
	    // If it is static then auto update data for the entire XyDataSeries FIFO, otherwise draw all data on a auto update timer
	    const staticData = this._options.autoUpdateType === ChartOptionsAutoUpdateTypeEnum.Static;
	    if (staticData) {
		this._updateDataNow(this._options.fifoTotalLength);
	    }
	    else {
		this._autoUpdateDataRangeTimer();
	    }
	}
    }
    
    _autoUpdateDataRangeTimer(): void {
	let scaleUpdateRate = this._options.autoUpdateSpeed < 1.0 ? 1.0 / this._options.autoUpdateSpeed : 1.0;
	let autoUpdateRange = (1000 / this._options.autoUpdateRateMsec) / this._options.xAxisDensity * this._options.autoUpdateSpeed * scaleUpdateRate;
	this._intervalId = setInterval(() => { this._updateDataNow(autoUpdateRange); }, this._options.autoUpdateRateMsec * scaleUpdateRate);
    }

    _createDataGenerator(): void {
	// Create the data genereator for the XyDataSeries that matches the Chart Options dataGenerator dataType setting
	const streamData = this._options.autoUpdateType === ChartOptionsAutoUpdateTypeEnum.Stream;
	if (this._options.dataType === ChartOptionsDataTypeEnum.SineWave) {
	    this._interface = new SineWaveXyDataSeriesInterface(this, this._options.fifoTotalLength, this._options.xAxisDensity, this._options.yAxisAmplitude, streamData, 3.5);
	    this.autoUpdateDataRange(this._options.fifoTotalLength);
	}
	if (this._options.dataType === ChartOptionsDataTypeEnum.RandomData) {
	    this._interface = new RandomDataXyDataSeriesInterface(this, this._options.fifoTotalLength, this._options.xAxisDensity, this._options.yAxisAmplitude, streamData);
	    this.autoUpdateDataRange(this._options.fifoTotalLength);
	}
	if (this._options.dataType === ChartOptionsDataTypeEnum.RandomWalk) {
	    this._interface = new RandomWalkXyDataSeriesInterface(this, this._options.fifoTotalLength, this._options.xAxisDensity, this._options.yAxisAmplitude, streamData);
	    this.autoUpdateDataRange(this._options.fifoTotalLength);
	}
	if (this._options.dataType === ChartOptionsDataTypeEnum.EegFixedData) {
	    this._interface = new EegFixedDataXyDataSeriesInterface(this, this._options.fifoTotalLength, this._options.xAxisDensity, this._options.yAxisAmplitude, streamData);
	    this.autoUpdateDataRange(this._options.fifoTotalLength);
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

    constructor (private _xyDataSeries: XyDataSeries, private _fifoCapacity: number, private _density: number, private _amplitude: number, private _streamData: boolean, private _numberWaves: number) {}

    autoUpdateDataRange(rangeCount: number): void {
	let xAxisOffset = this._streamData ? this._totalRangeCount : this._totalRangeCount % this._fifoCapacity;
	this._xyDataSeries.appendRange(
	    Array.from(makeIncArray(rangeCount), (x: number) => (x + xAxisOffset) / this._density),
	    Array.from(
		makeIncArray(rangeCount),
		(x: number) => Math.sin((2 * Math.PI * this._numberWaves) * ((x + this._totalRangeCount) / this._fifoCapacity) * this._amplitude)
	    )
	);
	this._totalRangeCount = this._totalRangeCount + rangeCount;
    }
}

export class SineWaveXyDataSeries extends ChartXyDataSeriesAbstractClass {
    constructor(_wasmContext: TSciChart, _fifoCapacity: number, _density: number, _amplitude: number, _streamData: boolean, ...args: any[]) {
	super(_wasmContext, _fifoCapacity, _density, _amplitude, _streamData, ...args);
	this._interface = new SineWaveXyDataSeriesInterface(this, _fifoCapacity, _density, _amplitude, _streamData, [...args][0]);
    }
}

class RandomDataXyDataSeriesInterface implements ChartXyDataSeriesInterface {
    private _totalRangeCount: number = 0;

    constructor (private _xyDataSeries: XyDataSeries, private _fifoCapacity: number, private _density: number, private _amplitude: number, private _streamData: boolean) {}

    autoUpdateDataRange(rangeCount: number): void {
	let xAxisOffset = this._streamData ? this._totalRangeCount : this._totalRangeCount % this._fifoCapacity;
	this._xyDataSeries.appendRange(
	    Array.from(makeIncArray(rangeCount), (x: number) => (x + xAxisOffset) / this._density),
	    Array.from(
		makeIncArray(rangeCount),
		(x: number) => Math.random() - 0.5 * this._amplitude
	    )
	);
	this._totalRangeCount = this._totalRangeCount + rangeCount;
    }
}

export class RandomDataXyDataSeries extends ChartXyDataSeriesAbstractClass {
    constructor(_wasmContext: TSciChart, _fifoCapacity: number, _density: number, _amplitude: number, _streamData: boolean) {
	super(_wasmContext, _fifoCapacity, _density, _amplitude, _streamData);
	this._interface = new RandomDataXyDataSeriesInterface(this, _fifoCapacity, _density, _amplitude, _streamData);
    }
}

class RandomWalkXyDataSeriesInterface implements ChartXyDataSeriesInterface {
    private _totalRangeCount: number = 0;
    private _lastRandomWalk: number = 0;

    constructor (private _xyDataSeries: XyDataSeries, private _fifoCapacity: number, private _density: number, private _amplitude: number, private _streamData: boolean) {}

    autoUpdateDataRange(rangeCount: number): void {
	let xAxisOffset = this._streamData ? this._totalRangeCount : this._totalRangeCount % this._fifoCapacity;
	this._xyDataSeries.appendRange(
	    Array.from(makeIncArray(rangeCount), (x: number) => (x + xAxisOffset) / this._density),
	    Array.from(
		makeIncArray(rangeCount),
		(x: number) => {
		    if (this._lastRandomWalk > 0.8 * this._amplitude) {
			const random = (Math.random() - 0.7);
			const step = random > 0 ? random * 0.01 : random * 0.04;
			this._lastRandomWalk = this._lastRandomWalk + step;
		    }
		    else if (this._lastRandomWalk < 0.8 * -this._amplitude) {
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
    constructor(_wasmContext: TSciChart, _fifoCapacity: number, _density: number, _amplitude: number, _streamData: boolean) {
	super(_wasmContext, _fifoCapacity, _density, _amplitude, _streamData);
	this._interface = new RandomWalkXyDataSeriesInterface(this, _fifoCapacity, _density, _amplitude, _streamData);
    }
}

class EegFixedDataXyDataSeriesInterface implements ChartXyDataSeriesInterface {
    private _eegFixedDataMaxX: number = -1000;
    private _eegFixedDataMinY: number = 1000;
    private _eegFixedDataMaxY: number = 0;
    private _eegFixedDataOffsetX: number = 0;
    private _eegFixedDataOffsetY: number = 0;
    private _scaleXAxis: number = 1.0;
    private _scaleYAxis: number = 1.0
    private _totalRangeCount: number = 0;

    constructor (private _xyDataSeries: XyDataSeries, private _fifoCapacity: number, private _density: number, private _amplitude: number, private _streamData: boolean) {
	for (let i = 0; i < eegFixedData01.length ; i++) {
	    if (eegFixedData01[i][0] > this._eegFixedDataMaxX) { this._eegFixedDataMaxX = eegFixedData01[i][0]; }
	    if (eegFixedData01[i][1] > this._eegFixedDataMaxY) { this._eegFixedDataMaxY = eegFixedData01[i][1]; }
	    if (eegFixedData01[i][1] < this._eegFixedDataMinY) { this._eegFixedDataMinY = eegFixedData01[i][1]; }
	    this._eegFixedDataOffsetY = -this._eegFixedDataMinY - (this._eegFixedDataMaxY - this._eegFixedDataMinY) / 2;
	}
	this._scaleXAxis = 100.0 / this._eegFixedDataMaxX;
	this._scaleYAxis = this._amplitude / -75.0;
    }

    autoUpdateDataRange(rangeCount: number): void {
	let xAxisOffset = this._streamData ? this._totalRangeCount : this._totalRangeCount % this._fifoCapacity;
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
    constructor(_wasmContext: TSciChart, _fifoCapacity: number, _density: number, _amplitude: number, _streamData: boolean) {
	super(_wasmContext, _fifoCapacity, _density, _amplitude, _streamData);
	this._interface = new EegFixedDataXyDataSeriesInterface(this, _fifoCapacity, _density, _amplitude, _streamData);
    }
}
