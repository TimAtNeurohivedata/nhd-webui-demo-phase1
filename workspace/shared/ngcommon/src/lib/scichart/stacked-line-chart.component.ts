import { Subscription } from 'rxjs';
import { Component } from '@angular/core';

import { ScichartAngularComponent } from "scichart-angular";
import { SciChartJsNavyTheme } from 'scichart';
import { SciChartSurface, TSciChart } from 'scichart';
import { EAxisAlignment, EAutoRange, FastLineRenderableSeries, NumericAxis, NumberRange } from 'scichart';
import { LeftAlignedOuterVerticallyStackedAxisLayoutStrategy } from 'scichart';

import { ChartOptionsService } from './chart-options.service';
import { ChartThemeService } from './chart-theme.service';
import { ChartXyDataSeries, ChartXyDataSeriesArray } from './xydataseries';

@Component({
    selector: 'nhd-ngcommon-scichart-stacked-line-chart',
    imports: [ScichartAngularComponent],
    standalone: true,

    template: `<scichart-angular [initChart]="initChart"></scichart-angular>`,
})

export class StackedLineChartComponent {
    initChart: any;
    stackedLineCount: number = 20;
    
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
	let xyDataSeriesArray = new ChartXyDataSeriesArray(this._scichartWasmContext, this.stackedLineCount, this._optionsService, true);
	for (let i = 0; i < this.stackedLineCount; i++) {
            const lineSeries = new FastLineRenderableSeries(this._scichartWasmContext, {
		stroke: "blue",
		strokeThickness: 2,
		yAxisId: this._scichartSurface.yAxes.get(i).id,
            });
            lineSeries.dataSeries = xyDataSeriesArray[i];
            this._scichartSurface.renderableSeries.add(lineSeries);
	}
    }

    private _createChartXAxes() {
	// Create the first x-axis with Grey color
	const xAxis = new NumericAxis(this._scichartWasmContext, {
	    axisBorder: { borderTop: 1, color: "#EEEEEE" },
	    autoRange: this._optionsService.streamDataEnabled ? EAutoRange.Always : EAutoRange.Once,
	    axisTitleStyle: { fontSize: 16, color: "#EEEEEE" },
	    axisTitle: "Timeline",
	    backgroundColor: "#EEEEEE11",
	    labelStyle:  { fontSize: 8, color: "#EEEEEE" },
	});
	this._scichartSurface.xAxes.add(xAxis);
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
		id: "Y" + i,
		labelStyle: { fontSize: 8, color: "#228B22" },
		maxAutoTicks: 5,
		visibleRange: new NumberRange(-1.0, 1.0),
		zoomExtentsToInitialRange: true,
	    });
	    this._scichartSurface.yAxes.add(leftYAxis);
	}
    }

    private _rebuildChartSurface() {
	// Cleanup the chart xAxes and yAxes
	this._scichartSurface.xAxes.clear();
	this._scichartSurface.yAxes.clear();
	
	// Cleanup the chart renderable series that is used for data lines
        this._scichartSurface.renderableSeries.clear();
	
	// Apply theme varaibles to the SciChartSurface
	this._scichartSurface.title = "StackedLineChartCompenent";

	// Call the funtions to create the other SciChart components that go with SciChartSurface
	this._createChartXAxes();
	this._createChartYAxes();

	// Create data for the graph
	this._createXyDataSeriesFromChartOptions();

	// Update the SciChartSurface theme colors
	this._updateChartThemeColors();
    }
    
    private _updateChartThemeColors() {
	if (this._optionsService.chartOptions.theme.useNativeSciChartTheme === false) {
	    this._scichartSurface.background = this._scichartTheme.sciChartBackground;
	    return;
	}
	let surfacebackgroundColor = this._themeService.chartThemeVariables.sciChartSurfaceBackgroundColor;
	if (surfacebackgroundColor !== undefined) { this._scichartSurface.background = surfacebackgroundColor; };
	let axisColor = this._themeService.chartThemeVariables.sciChartAxisColor;
	if (axisColor !== undefined) {
	    this._scichartSurface.xAxes.get(0).axisBorder.color = axisColor;
	    this._scichartSurface.xAxes.get(0).axisTitleStyle.color = axisColor;
	    this._scichartSurface.xAxes.get(0).labelStyle.color = axisColor;
	    for (let i = 0; i < this.stackedLineCount; i++) {
		this._scichartSurface.yAxes.get(i).axisBorder.color = axisColor;
		this._scichartSurface.yAxes.get(i).axisTitleStyle.color = axisColor;
		this._scichartSurface.yAxes.get(i).labelStyle.color = axisColor;
	    }
	}
	let numericAxisColor = this._themeService.chartThemeVariables.sciChartNumericAxisColor;
	if (numericAxisColor !== undefined) {
	    for (let i = 0; i < this.stackedLineCount; i++) {
		this._scichartSurface.renderableSeries.get(i).stroke = numericAxisColor;
	    }
	}
    }

    private async _initChart(rootElement: string | HTMLDivElement) {
	this._scichartRootElement = rootElement;
	const result = await this._createChartSurface(rootElement);
	return result;
    }
}
