import { Component } from '@angular/core';

import { makeIncArray, TSciChart, XyDataSeries } from "scichart";
import { EAxisAlignment, ECoordinateMode, EHorizontalAnchorPoint, EWrapTo, NativeTextAnnotation }  from "scichart";
import { FastLineRenderableSeries, LeftAlignedOuterVerticallyStackedAxisLayoutStrategy }  from "scichart";
import { NumericAxis, NumberRange, SciChartSurface }  from "scichart";
import { SciChartJsNavyTheme } from 'scichart';
import { ScichartAngularComponent } from "scichart-angular";

import { SettingsMatThemeService } from 'ngcore';

let scichartThemeSysVariableMap: { [key: string]: [string, string] } = {
    // "scichart-surface-background": ["--mat-sys-secondary-container", "#888888"],
    "scichart-surface-background": ["--mat-sys-surface-container", "#888888"],
    "scichart-surface-text-color": ["--mat-sys-primary", "#888888"],
    "scichart-surface-axis-color": ["--mat-sys-primary", "#888888"],
    "scichart-numeric-axis-color": ["--mat-sys-secondary", "#888888"],
};
let rootElementString: string | HTMLDivElement;

@Component({
    selector: 'nhd-ngcommon-scichart-stacked-line-chart',
    imports: [ScichartAngularComponent],
    standalone: true,

    template: `<scichart-angular [initChart]="drawExample"></scichart-angular>`,
})

export class StackedLineChartComponent {
    private _sysVariables: any = [];
    private _subscription: any;

    public drawExample = drawExample;

    constructor(private service: SettingsMatThemeService) {
	this._sysVariables = service.getSysVariables();
	this.updateScichartThemeSysVariableMap();
	this._subscription = this.service.themeUpdated$.subscribe(() => {
	    this._sysVariables = service.getSysVariables();
	    this.updateScichartThemeSysVariableMap();
	    drawExample(rootElementString);
	});
    }

    updateScichartThemeSysVariableMap() {
	Object.keys(scichartThemeSysVariableMap).forEach(key => {
	    let sysVariableName: any = scichartThemeSysVariableMap[key][0];
	    console.log(`Key: ${key}, Value: ${scichartThemeSysVariableMap[key]}`);
	    let sysVariableValue: any = this.service.getSysVariableByName(sysVariableName).value;
	    console.log("name, value: ", sysVariableName, sysVariableValue);
	    if (sysVariableValue === undefined) { return; }
	    sysVariableValue = this.convertRgbToHexIfNotHex(sysVariableValue);
	    scichartThemeSysVariableMap[key][1] = sysVariableValue;
	});
    }


    convertRgbToHexIfNotHex(color: string): string {
	if (color.startsWith('#')) {
	    return color; // Already in hex format, return as is
	}

	const rgbMatch = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
	if (rgbMatch) {
	    const r = parseInt(rgbMatch[1], 10);
	    const g = parseInt(rgbMatch[2], 10);
	    const b = parseInt(rgbMatch[3], 10);

	    const toHex = (c: number): string => {
		const hex = c.toString(16);
		return hex.length === 1 ? '0' + hex : hex;
	    };
	    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
	}
	return 'Invalid color format'; // Return an error message for invalid formats
    }
}

export const drawExample = async (rootElement: string | HTMLDivElement) => {
    rootElementString = rootElement;

    // Lookup all of the theme colors first
    const axisColor = scichartThemeSysVariableMap["scichart-surface-axis-color"][1];
    const labelStyle = { fontSize: 8, color: scichartThemeSysVariableMap["scichart-surface-axis-color"][1], }; // type TTextStyle
    const graphLineColor = scichartThemeSysVariableMap["scichart-numeric-axis-color"][1];
    const graphBackgroundColor = scichartThemeSysVariableMap["scichart-surface-background"][1];

    SciChartSurface.useWasmFromCDN();
    const { sciChartSurface, wasmContext } = await SciChartSurface.create(rootElement, {
        theme: new SciChartJsNavyTheme(),
    });
    sciChartSurface.background = graphBackgroundColor;

    sciChartSurface.layoutManager.leftOuterAxesLayoutStrategy =
        new LeftAlignedOuterVerticallyStackedAxisLayoutStrategy();

    sciChartSurface.xAxes.add(new NumericAxis(wasmContext, {
	axisTitle: "Timeline",
	axisTitleStyle: { fontSize: 16, color: axisColor },
	labelStyle: labelStyle,
	axisBorder: { borderTop: 1, color: axisColor },
    }));

    // Add title annotation
    sciChartSurface.annotations.add(
        new NativeTextAnnotation({
            // text: "Vertically Stacked Axis: Custom layout of axis to allow traces to overlap. Useful for ECG charts",
            fontSize: 16,
            // textColor: appTheme.ForegroundColor,
            textColor: scichartThemeSysVariableMap["scichart-surface-text-color"][1],
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

    for (let i = 0; i < seriesCount; i++) {
        const range = 10 / seriesCount;
        const yAxis = new NumericAxis(wasmContext, {
            id: "Y" + i,
            visibleRange: new NumberRange(-range, range),
            axisAlignment: EAxisAlignment.Left,
            zoomExtentsToInitialRange: true,
            maxAutoTicks: 5,
            drawMinorGridLines: false,
	    axisBorder: { borderTop: 0, borderBottom: 1, borderRight: 1, color: axisColor },
            axisTitle: `Y ${i}`,
	    axisTitleStyle: labelStyle,
	    labelStyle,
        });
        sciChartSurface.yAxes.add(yAxis);

        const lineSeries = new FastLineRenderableSeries(wasmContext, {
            yAxisId: yAxis.id,
            stroke: graphLineColor,
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
