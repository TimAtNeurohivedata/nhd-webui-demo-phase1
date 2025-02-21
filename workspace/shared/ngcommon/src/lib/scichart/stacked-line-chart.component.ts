import { Component } from '@angular/core';

import { makeIncArray, TSciChart, XyDataSeries } from "scichart";
import { EAxisAlignment, ECoordinateMode, EHorizontalAnchorPoint, EWrapTo, NativeTextAnnotation }  from "scichart";
import { FastLineRenderableSeries, LeftAlignedOuterVerticallyStackedAxisLayoutStrategy }  from "scichart";
import { NumericAxis, NumberRange, SciChartSurface }  from "scichart";
import { ScichartAngularComponent } from "scichart-angular";

@Component({
    selector: 'nhd-ngcommon-scichart-stacked-line-chart',
    imports: [ScichartAngularComponent],
    standalone: true,

    template: `<scichart-angular [initChart]="drawExample"></scichart-angular>`,
})

export class StackedLineChartComponent {
    drawExample = drawExample;
}

export const drawExample = async (rootElement: string | HTMLDivElement) => {
    SciChartSurface.useWasmFromCDN();
    const { sciChartSurface, wasmContext } = await SciChartSurface.create(rootElement, {
        // theme: appTheme.SciChartJsTheme,
    });

    sciChartSurface.layoutManager.leftOuterAxesLayoutStrategy =
        new LeftAlignedOuterVerticallyStackedAxisLayoutStrategy();

    sciChartSurface.xAxes.add(new NumericAxis(wasmContext, { axisTitle: "X Axis" }));

    // Add title annotation
    sciChartSurface.annotations.add(
        new NativeTextAnnotation({
            // text: "Vertically Stacked Axis: Custom layout of axis to allow traces to overlap. Useful for ECG charts",
            fontSize: 16,
            // textColor: appTheme.ForegroundColor,
            x1: 0.5,
            y1: 0,
            opacity: 0.77,
            horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
            xCoordinateMode: ECoordinateMode.Relative,
            yCoordinateMode: ECoordinateMode.Relative,
            wrapTo: EWrapTo.ViewRect,
        })
    );

    const seriesCount: number = 20;
    let dataSeriesArray = new StackedLineChartXyDataSeriesArray(wasmContext, seriesCount, 1000);
    dataSeriesArray.updateRange(1000);
    
    const labelStyle = { fontSize: 8 }; // type TTextStyle
    for (let i = 0; i < seriesCount; i++) {
        const range = 10 / seriesCount;
        const yAxis = new NumericAxis(wasmContext, {
            id: "Y" + i,
            visibleRange: new NumberRange(-range, range),
            axisAlignment: EAxisAlignment.Left,
            zoomExtentsToInitialRange: true,
            maxAutoTicks: 5,
            drawMinorGridLines: false,
            axisBorder: { borderTop: 0, borderBottom: 0 },
            axisTitle: `Y ${i}`,
	    axisTitleStyle: labelStyle,
	    labelStyle,
        });
        sciChartSurface.yAxes.add(yAxis);

        const lineSeries = new FastLineRenderableSeries(wasmContext, {
            yAxisId: yAxis.id,
            stroke: "auto",
            strokeThickness: 2,
        });
        lineSeries.dataSeries = dataSeriesArray[i]; // getRandomSinewave(wasmContext, 0, Math.random() * 3, Math.random() * 50, 10000, 10);
        sciChartSurface.renderableSeries.add(lineSeries);
    }

    // Optional: Add some interactivity modifiers to enable zooming and panning
    sciChartSurface.chartModifiers.add(
        // new YAxisDragModifier(),
        // new XAxisDragModifier(),
        // new RubberBandXyZoomModifier({ xyDirection: EXyDirection.XDirection, executeOn: EExecuteOn.MouseRightButton }),
        // new MouseWheelZoomModifier({ xyDirection: EXyDirection.YDirection }),
        // new ZoomExtentsModifier()
    );

    // Now let's use a timeout to appendRange() new values every 20ms.
    // using removeRange() causes the number of points in the series to remain fixed and the chart to scroll
    const updateCallback = () => {
	dataSeriesArray.updateRange(1000);
    }

    let timeoutMsec = 20;
    setTimeout(() => {
	updateCallback();
	setInterval(updateCallback, timeoutMsec);
    }, timeoutMsec);

    return { sciChartSurface, wasmContext };
};

export class StackedLineChartXyDataSeriesArray extends Array<StackedLineChartXyDataSeries> {
    dataSeries: StackedLineChartXyDataSeries[] = [];
    
    constructor(private _wasmContext: TSciChart, private _arrayLength: number, private _fifoCapacity: number) {
	super();
	for (let i = 0; i < _arrayLength ; i++) {
	    this[i] = new StackedLineChartXyDataSeries(_wasmContext, _fifoCapacity);
	}
    }

    updateRange(dataCount: number) {
	for (let i = 0 ; i < this._arrayLength ; i++) {
	    this[i].updateRange(dataCount);
	}
    }
}

export class StackedLineChartXyDataSeries extends XyDataSeries {
    constructor (private _wasmContext: TSciChart, private _fifoCapacity: number) {
        // Create an empty FIFO series
	// When data reaches fifoCapacity then old samples will be pushed and new samples appended to the end
        super(_wasmContext, {
	    containsNaN: true,
	    dataIsSortedInX: true,
	    dataEvenlySpacedInX: true,
	    fifoCapacity: _fifoCapacity,
	});
	
        // Fill with NaN values up to fifoCapacity
	// This stops the stretching effect when Fifo series are filled with AutoRange
	this.appendRange(Array(_fifoCapacity).fill(NaN), Array(_fifoCapacity).fill(NaN));
    }

    updateRange(rangeCount: number) {
	this.appendRange(makeIncArray(rangeCount), Array.from({length: rangeCount}, () => Math.random() - 0.5));
    }
}

export class RandomWalkGenerator {
    private readonly bias!: number;
    private last!: number;
    private i!: number;
    private _seed!: number;

    constructor(bias: number = 0.01) {
        this.bias = bias;
        this.reset();
    }

    public Seed(seed: number) {
        this._seed = seed % 2147483647;
        if (this._seed <= 0) this._seed += 2147483646;
        return this;
    }

    public reset() {
        this.i = 0;
        this.last = 0;
    }

    public getRandomWalkSeries(count: number): { xValues: number[]; yValues: number[] } {
        const xValues: number[] = [];
        const yValues: number[] = [];
        const random = () => (this._seed === undefined ? Math.random() : (this.nextSeeded() - 1) / 2147483646);
        for (let i = 0; i < count; i++) {
            const next: number = this.last + (random() - 0.5 + this.bias);
            xValues.push(this.i++);
            yValues.push(next);
            this.last = next;
        }

        return { xValues, yValues };
    }

    private nextSeeded() {
        return (this._seed = (this._seed * 16807) % 2147483647);
    }
}
