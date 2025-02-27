import { makeIncArray, TSciChart, XyDataSeries } from "scichart";

import { ChartOptionsService, chartOptionsDefault } from './chart-options.service';
import { ChartOptionsDataGeneratorType, ChartOptionsDataTypeEnum, ChartOptionsAutoUpdateTypeEnum } from './chart-options.service';

abstract class GeneratedXyDataSeries extends XyDataSeries {
    abstract autoUpdateDataRange(rangeCount: number): void;
}

export class XyDataSeriesService {
    private _intervalId: ReturnType<typeof setInterval> | undefined = undefined;
    private _options!: ChartOptionsDataGeneratorType;

    public xyDataSeries!: GeneratedXyDataSeries;

    constructor(private _wasmContext: TSciChart, optionsService?: ChartOptionsService, autoUpdateData: boolean = true) {
	// If the optionsService was passed as a parameter then use it fo the chart options otherwise use the default options values
	if (optionsService === undefined) {
	    this._options = chartOptionsDefault.dataGenerator;
	}
	else {
	    this._options = optionsService.chartOptions.dataGenerator;
	}

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
    
    _autoUpdateDataRangeTimer() {
	this._intervalId = setInterval(() => { this._updateDataNow(this._options.autoUpdateRange); }, this._options.autoUpdateRateMsec);
    }

    _createDataGenerator() {
	// Create the data genereator for the XyDataSeries that matches the Chart Options dataGenerator dataType setting
	const streamData = this._options.autoUpdateType === ChartOptionsAutoUpdateTypeEnum.Stream;
	if (this._options.dataType === ChartOptionsDataTypeEnum.SineWave) {
	    this.xyDataSeries = new SineWaveXyDataSeries(this._wasmContext, this._options.fifoTotalLength, 3.5, 1, streamData);
	    this.xyDataSeries.autoUpdateDataRange(this._options.fifoTotalLength);
	}
	if (this._options.dataType === ChartOptionsDataTypeEnum.RandomData) {
	    this.xyDataSeries = new RandomDataXyDataSeries(this._wasmContext, this._options.fifoTotalLength, 1, streamData);
	    this.xyDataSeries.autoUpdateDataRange(this._options.fifoTotalLength);
	}
	if (this._options.dataType === ChartOptionsDataTypeEnum.RandomWalk) {
	    this.xyDataSeries = new RandomWalkXyDataSeries(this._wasmContext, this._options.fifoTotalLength, 1, streamData);
	    this.xyDataSeries.autoUpdateDataRange(this._options.fifoTotalLength);
	}
    }

    _updateDataNow(rangeCount: number) {
	if (this.xyDataSeries === undefined) {
	    clearInterval(this._intervalId);
	    this._intervalId = undefined;
	    return;
	}
	this.xyDataSeries.autoUpdateDataRange(rangeCount);
    }
}

export class SineWaveXyDataSeries extends GeneratedXyDataSeries {
    private _totalRangeCount: number = 0;

    constructor (private _wasmContext: TSciChart, private _fifoCapacity: number, private _numberWaves: number, private _amplitude: number, private _streamData: boolean) {
        // Create an empty FIFO series
	// When data reaches fifoCapacity then old samples will be pushed and new samples appended to the end
        super(_wasmContext, {
	    containsNaN: true,
	    dataIsSortedInX: true,
	    dataEvenlySpacedInX: true,
	    fifoCapacity: _fifoCapacity,
	    fifoSweeping: true,
	});
	
        // Fill with NaN values up to fifoCapacity
	// This stops the stretching effect when Fifo series are filled with AutoRange
	this.appendRange(Array(_fifoCapacity).fill(NaN), Array(_fifoCapacity).fill(NaN));
    }

    autoUpdateDataRange(rangeCount: number): void {
	let xAxisOffset = this._streamData ? this._totalRangeCount : this._totalRangeCount % this._fifoCapacity;
	this.appendRange(
	    Array.from(makeIncArray(rangeCount), (x: number) => x + xAxisOffset),
	    Array.from(
		makeIncArray(rangeCount),
		(x: number) => Math.sin((2 * Math.PI * this._numberWaves) * ((x + this._totalRangeCount) / this._fifoCapacity) * this._amplitude)
	    )
	);
	this._totalRangeCount = this._totalRangeCount + rangeCount;
    }
}

export class RandomDataXyDataSeries extends GeneratedXyDataSeries {
    private _totalRangeCount: number = 0;

    constructor (private _wasmContext: TSciChart, private _fifoCapacity: number, private _amplitude: number, private _streamData: boolean) {
        // Create an empty FIFO series
	// When data reaches fifoCapacity then old samples will be pushed and new samples appended to the end
        super(_wasmContext, {
	    containsNaN: true,
	    dataIsSortedInX: true,
	    dataEvenlySpacedInX: true,
	    fifoCapacity: _fifoCapacity,
	    fifoSweeping: true,
	});
	
        // Fill with NaN values up to fifoCapacity
	// This stops the stretching effect when Fifo series are filled with AutoRange
	this.appendRange(Array(_fifoCapacity).fill(NaN), Array(_fifoCapacity).fill(NaN));
    }

    autoUpdateDataRange(rangeCount: number): void {
	let xAxisOffset = this._streamData ? this._totalRangeCount : this._totalRangeCount % this._fifoCapacity;
	this.appendRange(
	    Array.from(makeIncArray(rangeCount), (x: number) => x + xAxisOffset),
	    Array.from(
		makeIncArray(rangeCount),
		(x: number) => Math.random() - 0.5 * this._amplitude
	    )
	);
	this._totalRangeCount = this._totalRangeCount + rangeCount;
    }

    updateRange(rangeCount: number) {
	this.appendRange(makeIncArray(rangeCount), Array.from({length: rangeCount}, () => Math.random() - 0.5));
    }
}

export class RandomWalkXyDataSeries extends GeneratedXyDataSeries {
    private _totalRangeCount: number = 0;
    private _lastRandomWalk: number = 0;
    
    constructor (private _wasmContext: TSciChart, private _fifoCapacity: number, private _amplitude: number, private _streamData: boolean) {
        // Create an empty FIFO series
	// When data reaches fifoCapacity then old samples will be pushed and new samples appended to the end
        super(_wasmContext, {
	    containsNaN: true,
	    dataIsSortedInX: true,
	    dataEvenlySpacedInX: true,
	    fifoCapacity: _fifoCapacity,
	    fifoSweeping: true,
	});
	
        // Fill with NaN values up to fifoCapacity
	// This stops the stretching effect when Fifo series are filled with AutoRange
	this.appendRange(Array(_fifoCapacity).fill(NaN), Array(_fifoCapacity).fill(NaN));
    }

    autoUpdateDataRange(rangeCount: number): void {
	let xAxisOffset = this._streamData ? this._totalRangeCount : this._totalRangeCount % this._fifoCapacity;
	this.appendRange(
	    Array.from(makeIncArray(rangeCount), (x: number) => x + xAxisOffset),
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
