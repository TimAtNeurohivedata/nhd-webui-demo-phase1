import { Subscription } from 'rxjs';
import { Component } from '@angular/core';

import { ScichartAngularComponent } from "scichart-angular";
import { SciChartJsNavyTheme } from 'scichart';
import { SciChartSurface, TSciChart } from 'scichart';
import { EAxisAlignment, EAutoRange, FastLineRenderableSeries, NumericAxis, NumberRange } from 'scichart';

import { ChartOptionsService } from './chart-options.service';
import { ChartThemeService } from './chart-theme.service';
import { ChartXyDataSeries } from './xydataseries';

@Component({
    selector: 'nhd-ngcommon-scichart-basic-chart',
    imports: [ScichartAngularComponent],
    standalone: true,

    template: `<scichart-angular [initChart]="initChart"></scichart-angular>`,
})

export class BasicChartComponent {
    initChart: any;
    
    private _optionsSubscription!: Subscription;
    private _scichartRootElement!: string | HTMLDivElement;
    private _scichartSurface!: SciChartSurface;
    private _scichartTheme: SciChartJsNavyTheme = new SciChartJsNavyTheme();
    private _scichartWasmContext!: TSciChart;
    private _themeSubscription!: Subscription;

    constructor(private _optionsService: ChartOptionsService, private _themeService: ChartThemeService) {
	this.initChart = (rootElement: string | HTMLDivElement) => { return this._initChart(rootElement); }
    }

    private async _createChartSurface(rootElement: string | HTMLDivElement) {
	// Create a SciChartSurface
	SciChartSurface.useWasmFromCDN();
	const { sciChartSurface, wasmContext } = await SciChartSurface.create(this._scichartRootElement, {
            theme: this._scichartTheme
	});
	this._scichartSurface = sciChartSurface;
	this._scichartWasmContext = wasmContext;
	
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
        const lineSeries = new FastLineRenderableSeries(this._scichartWasmContext, {
            stroke: "blue",
            strokeThickness: 2,
        });
	let xyDataSeries = new ChartXyDataSeries(this._scichartWasmContext, this._optionsService.chartOptions.dataGenerator, true);
        lineSeries.dataSeries = xyDataSeries;
        this._scichartSurface.renderableSeries.add(lineSeries);
    }

    private _createChartXAxes() {
	// Create the first x-axis with Grey color
	const xAxis = new NumericAxis(this._scichartWasmContext, {
	    autoRange: this._optionsService.streamDataEnabled ? EAutoRange.Always : EAutoRange.Once,
	    axisTitleStyle: { color: "#EEEEEE" },
	    axisTitle: "X Axis",
	    axisBorder: {
		borderTop: 1,
		color: "#EEEEEE"
	    },
	    backgroundColor: "#EEEEEE11",
	});
	this._scichartSurface.xAxes.add(xAxis);
    }

    private _createChartYAxes() {
	// Create the left y-axis with Green color
	const leftYAxis = new NumericAxis(this._scichartWasmContext, {
	    axisAlignment: EAxisAlignment.Left,
	    axisTitleStyle: { color: "#228B22" },
	    axisTitle: "Left Axis",
	    axisBorder: {
		borderRight: 1,
		color: "#228B22" // Green color
	    },
	    backgroundColor: "#228B2222",
	    visibleRange: new NumberRange(-1.0, 1.0),
	});
	this._scichartSurface.yAxes.add(leftYAxis);

	// Create the right y-axis with Blue color
	const rightYAxis = new NumericAxis(this._scichartWasmContext, {
	    axisTitleStyle: { color: "#368BC1" },
	    id: "RightAxis",
	    axisTitle: "Right Axis",
	    axisBorder: {
		borderLeft: 1,
		color: "#368BC1"
	    },
	    backgroundColor: "#368BC111"
	});
	this._scichartSurface.yAxes.add(rightYAxis);
    }

    private _rebuildChartSurface() {
	// Cleanup the chart xAxes and yAxes
	this._scichartSurface.xAxes.clear();
	this._scichartSurface.yAxes.clear();
	
	// Cleanup the chart renderable series that is used for data lines
        this._scichartSurface.renderableSeries.clear();
	
	// Apply theme varaibles to the SciChartSurface
	this._scichartSurface.title = "BasicChartCompenent";

	// Call the funtions to create the other SciChart components that go with SciChartSurface
	this._createChartXAxes();
	this._createChartYAxes();

	// Create data for the graph
	this._createXyDataSeriesFromChartOptions();

	// Update the SciChartSurface theme colors
	this._updateChartThemeColors();
    }
    
    private _updateChartThemeColors() {
	if (this._optionsService.chartOptions.theme.useNativeSciChartTheme === false) { return; }
	let surfacebackgroundColor = this._themeService.chartThemeVariables.sciChartSurfaceBackgroundColor;
	if (surfacebackgroundColor !== undefined) { this._scichartSurface.background = surfacebackgroundColor; };
	let axisColor = this._themeService.chartThemeVariables.sciChartAxisColor;
	if (axisColor !== undefined) {
	    this._scichartSurface.xAxes.get(0).axisBorder.color = axisColor;
	    this._scichartSurface.xAxes.get(0).axisTitleStyle.color = axisColor;
	    this._scichartSurface.xAxes.get(0).labelStyle.color = axisColor;
	    this._scichartSurface.yAxes.get(0).axisBorder.color = axisColor;
	    this._scichartSurface.yAxes.get(0).axisTitleStyle.color = axisColor;
	    this._scichartSurface.yAxes.get(0).labelStyle.color = axisColor;
	    this._scichartSurface.yAxes.get(1).axisBorder.color = axisColor;
	    this._scichartSurface.yAxes.get(1).axisTitleStyle.color = axisColor;
	    this._scichartSurface.yAxes.get(1).labelStyle.color = axisColor;
	}
	let numericAxisColor = this._themeService.chartThemeVariables.sciChartNumericAxisColor;
	if (numericAxisColor !== undefined) {
	    this._scichartSurface.renderableSeries.get(0).stroke = numericAxisColor;
	}
    }

    private async _initChart(rootElement: string | HTMLDivElement) {
	this._scichartRootElement = rootElement;
	const result = await this._createChartSurface(rootElement);
	return result;
    }
}
