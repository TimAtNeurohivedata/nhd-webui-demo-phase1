import { BehaviorSubject, Subscription } from 'rxjs';
import { Component } from '@angular/core';

import { ScichartAngularComponent } from "scichart-angular";
import { SciChartJsNavyTheme } from 'scichart';
import { SciChartSurface, TSciChart } from 'scichart';
import { EAxisAlignment, EAutoRange, FastLineRenderableSeries, NumericAxis, NumberRange } from 'scichart';
import { LeftAlignedOuterVerticallyStackedAxisLayoutStrategy, Thickness } from 'scichart';
import { DateLabelProvider, DateTimeNumericAxis, NumericLabelProvider, NumericTickProvider, TFormatLabelFn } from 'scichart';

import { ChartOptionsService } from './chart-options.service';
import { ChartThemeService } from './chart-theme.service';
import { ChartXyDataSeries, ChartXyDataSeriesArray } from './xydataseries';

@Component({
    selector: 'nhd-ngcommon-scichart-stacked-line-chart',
    imports: [ScichartAngularComponent],
    standalone: true,

    template: `<scichart-angular [initChart]="initStackedLineChart" (onInit)="onInit$.next(true)"></scichart-angular>`,
})

export class StackedLineChartComponent {
    onInit$ = new BehaviorSubject<boolean>(false);
    initStackedLineChart: any;
    scichartSurface!: SciChartSurface;
    stackedLineCount: number = 20;
    
    private _optionsSubscription!: Subscription;
    private _scichartRootElement!: string | HTMLDivElement;
    private _scichartSurface!: SciChartSurface;
    private _scichartTheme: SciChartJsNavyTheme = new SciChartJsNavyTheme();
    private _scichartWasmContext!: TSciChart;
    private _themeSubscription!: Subscription;

    constructor(private _optionsService: ChartOptionsService, private _themeService: ChartThemeService) {
	this.initStackedLineChart = (rootElement: string | HTMLDivElement) => { return this._initStackedLineChart(rootElement); }
    }

    private async _createChartSurface(rootElement: string | HTMLDivElement) {
	// Create a SciChartSurface
	SciChartSurface.useWasmFromCDN();
	const { sciChartSurface, wasmContext } = await SciChartSurface.create(this._scichartRootElement, {
            theme: this._scichartTheme
	});
	this._scichartSurface = sciChartSurface;
	this._scichartWasmContext = wasmContext;
	this.scichartSurface = sciChartSurface;

	// Rebuild the SciChartSurface for the first time
	this._rebuildChartSurface();

	// Subscribe to rebuild the chart if any of the ChartOptions are updated
	this._optionsSubscription = this._optionsService.chartOptions$.subscribe(() => {
	    this._rebuildChartSurface();
	});
	this._themeSubscription = this._themeService.chartThemeVariables$.subscribe(() => {
	    this._rebuildChartSurface();
	});
	
	// Return the values expected for the <scichart-angular> [initChart] property binding function
	return { sciChartSurface, wasmContext };
    }

    private _createXyDataSeriesFromChartOptions() {
	let xyDataSeriesArray = new ChartXyDataSeriesArray(this._scichartWasmContext, this.stackedLineCount, this._optionsService.chartOptions.dataGenerator, true);
	for (let i = 0; i < this.stackedLineCount; i++) {
            const lineSeries = new FastLineRenderableSeries(this._scichartWasmContext, {
		stroke: "blue",
		strokeThickness: 2,
		yAxisId: this._scichartSurface.yAxes.get(i).id,
            });
            lineSeries.dataSeries = xyDataSeriesArray[i];
            this._scichartSurface.renderableSeries.add(lineSeries);
	}
	xyDataSeriesArray.autoUpdateCallback = ((visibleRange: NumberRange) => {
	    this._scichartSurface.xAxes.get(0).visibleRange = visibleRange;
	});
    }

    private _createChartXAxes() {
	// Create the first x-axis which has static time numbers that are not updated
	// Create the first x-axis with Grey color
	const xAxis1 = new NumericAxis(this._scichartWasmContext, {
	    autoRange: this._optionsService.streamDataEnabled ? EAutoRange.Never : EAutoRange.Never,
	    axisBorder: { borderTop: 1, color: "#EEEEEE" },
	    axisTitleStyle: { fontSize: 16, color: "#EEEEEE" },
	    axisTitle: "Timeline",
	    backgroundColor: "#EEEEEE11",
	    clipToXRange: false,
	    drawMinorGridLines: false,
	    drawMajorGridLines: false,
	    labelProvider: new NumericLabelProviderFixed(),
	    labelStyle:  { fontSize: 8, color: "#EEEEEE" },
	    visibleRange: new NumberRange(0, 100),
	});
	xAxis1.tickProvider = new NumericTickProviderFullWidth(this._scichartWasmContext, 10);
	this._scichartSurface.xAxes.add(xAxis1);

	// Create the second axis which has the beginning date/time on left side and ending date/time on right side
	// These are for the data that is currently being shown on the chart
	const xAxis2 = new DateTimeNumericAxis(this._scichartWasmContext, {
	    autoRange: this._optionsService.streamDataEnabled ? EAutoRange.Always : EAutoRange.Once,
	    axisTitleStyle: { color: "#EEEEEE" },
	    backgroundColor: "#EEEEEE11",
	    clipToXRange: true,
	    drawMinorGridLines: false,
	    drawMajorGridLines: false,
	    labelProvider: new DynamicDateLabelProvider(),
            maxAutoTicks: 2,
	    visibleRange: new NumberRange(0, 100),
	});
	xAxis2.labelStyle.padding = new Thickness(0, 75, 0, 0);
	xAxis2.tickProvider = new NumericTickProviderFullWidth(this._scichartWasmContext, 1);
	this._scichartSurface.xAxes.add(xAxis2);
    }

    private _createChartYAxes() {
	// Set the chart layout strategy for the left outer axes
	let layoutStrategy = new LeftAlignedOuterVerticallyStackedAxisLayoutStrategy();
	this._scichartSurface.layoutManager.leftOuterAxesLayoutStrategy = layoutStrategy;

	// Create the left innner y-axis for the stacked lines with Green color
	for (let i = 0; i < this.stackedLineCount; i++) {
	    const leftYAxis = new NumericAxis(this._scichartWasmContext, {
		axisAlignment: EAxisAlignment.Left,
		axisBorder: { borderTop: 0, borderBottom: 1, borderRight: 1, color: "#228B22" },
		axisTitle: `Y ${i}`,
		axisTitleStyle: { fontSize: 8, color: "#228B22" },
		backgroundColor: "#228B2222",
		drawMinorGridLines: false,
		drawMajorGridLines: true,
		id: "Y" + i,
		labelStyle: { fontSize: 8, color: "#228B22" },
		maxAutoTicks: 1,
		majorDelta: 2,
		visibleRange: new NumberRange(-1.0, 1.0),
		zoomExtentsToInitialRange: true,
	    });
	    this._scichartSurface.yAxes.add(leftYAxis);
	}
    }

    private _rebuildChartSurface() {
	// Let other components know the chart is reinitializing
	this.onInit$.next(false);

	// Cleanup the chart xAxes and yAxes
	this._scichartSurface.xAxes.clear();
	this._scichartSurface.yAxes.clear();
	
	// Cleanup the chart renderable series that is used for data lines
        this._scichartSurface.renderableSeries.clear();
	
	// Call the funtions to create the other SciChart components that go with SciChartSurface
	this._createChartXAxes();
	this._createChartYAxes();

	// Create data for the graph
	this._createXyDataSeriesFromChartOptions();

	// Update the SciChartSurface theme colors
	this._updateChartThemeColors();

	// Let other components know the chart is finished reinitializing
	this.onInit$.next(true);
    }
    
    private _updateChartThemeColors() {
	// Set the scichartSurface background color
	let surfacebackgroundColor =this._themeService.chartThemeVariables.sciChartSurfaceBackgroundColor;
	if (this._optionsService.chartOptions.theme.useNativeSciChartTheme === true || surfacebackgroundColor === undefined) {
	    surfacebackgroundColor = this._scichartTheme.sciChartBackground;
	}
	this._scichartSurface.background = surfacebackgroundColor;

	// If useNativeSciChartTheme is set then all the axes colors then use the default colors already set
	if (this._optionsService.chartOptions.theme.useNativeSciChartTheme === true) { return; }

	// Update the graph xAxes and yAxes colors
	let axisColor = this._themeService.chartThemeVariables.sciChartAxisColor;
	if (axisColor !== undefined) {
	    for (let i = 0; i < this._scichartSurface.xAxes.size(); i++) {
		this._scichartSurface.xAxes.get(i).axisBorder.color = axisColor;
		this._scichartSurface.xAxes.get(i).axisTitleStyle.color = axisColor;
		this._scichartSurface.xAxes.get(i).backgroundColor = surfacebackgroundColor;
		this._scichartSurface.xAxes.get(i).labelStyle.color = axisColor;
	    }
	    for (let i = 0; i < this._scichartSurface.yAxes.size(); i++) {
		this._scichartSurface.yAxes.get(i).axisBorder.color = axisColor;
		this._scichartSurface.yAxes.get(i).axisTitleStyle.color = axisColor;
		this._scichartSurface.yAxes.get(i).backgroundColor = surfacebackgroundColor;
		this._scichartSurface.yAxes.get(i).labelStyle.color = axisColor;
	    }
	}

	// Update the graph line stroke colors
	let numericAxisColor = this._themeService.chartThemeVariables.sciChartNumericAxisColor;
	if (numericAxisColor !== undefined) {
	    for (let i = 0; i < this._scichartSurface.renderableSeries.size(); i++) {
		this._scichartSurface.renderableSeries.get(i).stroke = numericAxisColor;
	    }
	}
    }

    private async _initStackedLineChart(rootElement: string | HTMLDivElement) {
	this._scichartRootElement = rootElement;
	const result = await this._createChartSurface(rootElement);
	return result;
    }
}

class DynamicDateLabelProvider extends DateLabelProvider {
    // Different thesholds of axis.visibleRange.max - min to trigger format changes
    SECONDS_IN_DAY = 86400;
    SECONDS_IN_HOUR = 60 * 60 * 6;
    SECONDS_IN_MINUTE = 60 * 30;
    private _initialUnixTimestamp = Math.floor(Date.now() / 1000);

    constructor() {
	super();
	// Disable caching due to dynamic nature of the labels
	this.useCache = false;
    }

    // Called for each label
    override get formatLabel(): TFormatLabelFn {
	return this._formatLabel;
    }

    private _formatLabel(dataValue: any): string {
	const axisRange = this.parentAxis.visibleRange;

	// assuming label dataValue is a unix timestamp / 1000 (attached to Date axis)
	const unixTimeStamp = this._initialUnixTimestamp + dataValue;
	const date = new Date(unixTimeStamp * 1000);
	const hours = date.getUTCHours();
	const minutes = date.getUTCMinutes();
	const seconds = date.getUTCSeconds();
	const milliseconds = date.getUTCMilliseconds();

	let outputString: string = "";
	const hoursString = hours <= 9 ? `0${hours}` : hours.toString(10);
	const minutesString = minutes <= 9 ? `0${minutes}` : minutes.toString(10);
	const secondsString = seconds <= 9 ? `0${seconds}` : seconds.toString(10);

	// Format as DD:MM:YY
	if (true) {
	    let dateString = date.toLocaleDateString("en-GB", {
		year: "2-digit",
		month: "2-digit",
		day: "2-digit"
	    });
	    outputString = outputString + dateString + " ";
	}
	
	// Format as HH:MM
	if (false) {
	    let hmString = `${hoursString}:${minutesString}`;
	    outputString = outputString + hmString + " ";
	}

	// Format as HH:MM:SS
	if (true) {
	    let hmsString = `${hoursString}:${minutesString}:${secondsString}`;
	    outputString = outputString + hmsString + " ";
	}

	// Format as 00m00s 000ms
	if (false) {
	    let millisecondsString = `00` + milliseconds.toString(10);
	    millisecondsString = `${minutesString}m${secondsString}s ${millisecondsString}ms`;
	    outputString = outputString + millisecondsString + " ";
	}

	// Format as 000ms
	if (true) {
	    let millisecondsString = milliseconds.toString(10).padStart(4, "0");
	    millisecondsString = `${millisecondsString}ms`;
	    outputString = outputString + millisecondsString + " ";
	}

	outputString = outputString;
	return outputString
    }
}

class NumericLabelProviderFixed extends DateLabelProvider {
    // Called for each label
    override get formatLabel(): TFormatLabelFn {
	return this._formatLabel;
    }

    private _formatLabel(dataValue: any): string {
        // Get the start and end values of the visible range
	const axisRange = this.parentAxis.visibleRange;
        const start = axisRange.min;
        const end = axisRange.max;
	let numericValue = dataValue - start;
	const roundedNum = Math.round(numericValue);
	if (Math.abs(numericValue - roundedNum) < 0.1) {
	    numericValue = roundedNum;
	}
	let numericString = numericValue.toFixed(1);
	// console.log("min/max/diff/dataValue/numericValue: ", start, end, end - start, dataValue, numericValue);
	return numericString;
    }
}

class NumericTickProviderFullWidth extends NumericTickProvider {
    constructor(private _wasmContext: TSciChart, private _tickPoints: number) {
	super(_wasmContext);
    }

    override getMajorTicks(minorDelta: number, majorDelta: number, visibleRange: NumberRange): number[] {
        // Get the start and end values of the visible range
        let start = visibleRange.min;
        let end = visibleRange.max;

        // Create an array of ticks, always including the edge values
	let ticks: any[] = [];
	for (let i = 0 ; i <= this._tickPoints ; i++) {
	    ticks.push(start + (end - start) * i / this._tickPoints);
	}
	// console.log("min/max/ticks: ", start, end, ticks);

	// If the last tick is slightly higher than the visibleRange.max then it will not qureied for NumericLabelProviderFixed
	// When this happens this last label on bottom right will flash occasinally
	// Example data:
	// visibleRange.start = 21.17988394584139  visibleRange.End = 118.2301740812379
	// ticks = [21.17988394584139, 30.88491295938104, 40.5899419729207, 50.29497098646035, 60, 69.70502901353964, 79.41005802707932, 89.11508704061896, 98.8201160541586, 108.52514506769825, 118.23017408123792]
	if (ticks[this._tickPoints] > end) { ticks[this._tickPoints] = end; }

	// Return the ticks array that contains the xAxis value where each majro tick will be placed
	// (which is why last one flases if just slightly higher then visbleRange.end)
	return ticks;
    }
}
