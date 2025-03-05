import { BehaviorSubject, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { ScichartAngularComponent } from "scichart-angular";
import { SciChartJsNavyTheme } from 'scichart';
import { SciChartOverview, SciChartSurface, TSciChart } from 'scichart';
import { NumberRange } from 'scichart';
import { ECoordinateMode, VerticalLineAnnotation } from 'scichart';

import { ChartOptionsService } from './chart-options.service';
import { ChartThemeService } from './chart-theme.service';
import { globalChartXyDataSeriesArray } from './xydataseries';

@Component({
    selector: 'nhd-ngcommon-scichart-overview-chart',
    imports: [CommonModule, ScichartAngularComponent],
    standalone: true,

    template: `<scichart-angular [initChart]="initChart" *ngIf="onInit$ | async">`,
})

export class OverviewChartComponent {
    @Input('onInit$') onInit$!: BehaviorSubject<boolean>;
    @Input('scichartSurface') scichartSurface!: SciChartSurface;

    initChart: any;
    onInit = this.__onInit;
    
    private _onInitSubscription!: Subscription;
    private _scichartDeleted = false;
    private _scichartOverview!: SciChartOverview;
    private _scichartRootElement!: string | HTMLDivElement;
    private _scichartSurface!: SciChartSurface;
    private _scichartTheme: SciChartJsNavyTheme = new SciChartJsNavyTheme();
    
    constructor(private _optionsService: ChartOptionsService, private _themeService: ChartThemeService) {
	this.initChart = (rootElement: string | HTMLDivElement) => { return this.__initOverview(this.scichartSurface, rootElement); }
    }

    private async _createOverview(scichartSurface: SciChartSurface, rootElement: string | HTMLDivElement) {
	// Create a SciChartOverview
	const scichartOverview = await SciChartOverview.create(scichartSurface, rootElement, {
            // prevent default size settings
	    disableAspect: true,
	    padding: { top: 0, bottom: 0, left: 10, right: 10 },
            theme: this._scichartTheme,
        });
	scichartOverview.overviewSciChartSurface.padding = { top: 0, bottom: 0, left: 52, right: 10 };
	this._scichartOverview = scichartOverview;
	this._scichartRootElement = rootElement;

	// Default padding is 10
	// overviewXAxis provides a shortcut to overviewSciChartSurface.xAxes.get(0)
	scichartOverview.overviewXAxis.isVisible = true;
	scichartOverview.overviewXAxis.isInnerAxis = true;
	scichartOverview.overviewXAxis.drawMinorGridLines = false;
	scichartOverview.overviewXAxis.labelProvider.precision = 0;
	scichartOverview.overviewXAxis.labelStyle.fontSize = 8;
	scichartOverview.rangeSelectionModifier.onSelectedAreaChanged = ((area?: NumberRange) => {
	    // console.log("scichartOverview.rangeSelectionModifier.onSelectedAreaChanged area: ", area);
	    // console.log("scichartSurface.xAxes.get(0).visibleRange: ", scichartSurface.xAxes.get(0).visibleRange);
	    if (area !== undefined) { globalChartXyDataSeriesArray.visibleRange = area };
	});

	// Create annotations for the graph
	this._createXyAnnotationsFromChartOptions();

	// Update the SciChartSurface theme colors
	this._updateChartThemeColors();

	// Subscribe to rebuild the chart if any of the ChartSurface is updated and ready
	if (this._onInitSubscription === undefined) {
	    this._onInitSubscription = this.onInit$.subscribe((onInit: boolean) => {
		this.onInit(onInit);
	    });
	}

	return { sciChartSurface: scichartOverview.overviewSciChartSurface };
    }

    private _createXyAnnotationsFromChartOptions() {
	let annotations = globalChartXyDataSeriesArray.annotations;
	console.log("annotations: ", annotations);
	for (let i = 0 ; i < this._scichartOverview.overviewSciChartSurface.annotations.size() ; i++) {
	    const verticalLineAnnotation = this._scichartOverview.overviewSciChartSurface.annotations.get(i);
	    this._scichartOverview.overviewSciChartSurface.annotations.remove(verticalLineAnnotation);
	}
	for (let i = 0 ; i < annotations.length ; i++) {
	    const verticalLineAnnotation = new VerticalLineAnnotation( { x1: annotations[i].x, y1: annotations[i].y, stroke: "#FF0000"});
	    verticalLineAnnotation.xCoordinateMode = ECoordinateMode.DataValue;
	    this._scichartOverview.overviewSciChartSurface.annotations.add(verticalLineAnnotation);
	}
    }

    private _updateChartThemeColors() {
	// Set the scichartOverview background color and tickTextBrush color which can only be done by applying it to a theme
	let scichartOverviewTheme: SciChartJsNavyTheme = new SciChartJsNavyTheme();
	let overviewBackgroundColor = this._themeService.chartThemeVariables.sciChartSurfaceBackgroundColor;
	let tickTextBrushColor = this._themeService.chartThemeVariables.sciChartAxisColor;
	if (this._optionsService.chartOptions.theme.useNativeSciChartTheme === true) {
	    overviewBackgroundColor = this._scichartTheme.sciChartBackground;
	    tickTextBrushColor = this._scichartTheme.tickTextBrush;
	}
	if (overviewBackgroundColor !== undefined) { scichartOverviewTheme.sciChartBackground = overviewBackgroundColor; }
	if (tickTextBrushColor !== undefined) { scichartOverviewTheme.tickTextBrush = tickTextBrushColor; }
	this._scichartOverview.applyTheme(scichartOverviewTheme);
    }

    private async __initOverview(scichartSurface: SciChartSurface, rootElement: string | HTMLDivElement) {
	const result = await this._createOverview(scichartSurface, rootElement);
	return result;
    }

    private __onInit(onInit: boolean) {
	if (onInit === false) {
	    this._scichartOverview.delete();
	    this._scichartDeleted = true;
	}
	if (onInit === true && this._scichartDeleted) {
	    this._scichartDeleted = false;
	    this._createOverview(this.scichartSurface, this._scichartRootElement);
	}
    }
}
