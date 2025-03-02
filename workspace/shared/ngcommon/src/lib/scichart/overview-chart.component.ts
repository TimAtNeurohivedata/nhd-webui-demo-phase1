import { BehaviorSubject, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { ScichartAngularComponent } from "scichart-angular";
import { SciChartJsNavyTheme } from 'scichart';
import { SciChartOverview, SciChartSurface, TSciChart } from 'scichart';

import { ChartOptionsService } from './chart-options.service';
import { ChartThemeService } from './chart-theme.service';

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
    onInit = this._onInit;
    
    private _onInitSubscription!: Subscription;
    private _scichartDeleted = false;
    private _scichartOverview!: SciChartOverview;
    private _scichartRootElement!: string | HTMLDivElement;
    private _scichartSurface!: SciChartSurface;
    private _scichartTheme: SciChartJsNavyTheme = new SciChartJsNavyTheme();
    
    constructor(private _optionsService: ChartOptionsService, private _themeService: ChartThemeService) {
	this.initChart = (rootElement: string | HTMLDivElement) => { return this._initOverview(this.scichartSurface, rootElement); }
    }

    private async _createOverview(scichartSurface: SciChartSurface, rootElement: string | HTMLDivElement) {
	// Create a SciChartOverview
	const scichartOverview = await SciChartOverview.create(scichartSurface, rootElement, {
            // prevent default size settings
	    disableAspect: true,
            theme: this._scichartTheme,
            // transformRenderableSeries: getOverviewSeries,
        });
	this._scichartOverview = scichartOverview;
	this._scichartRootElement = rootElement;
	    
	// Default padding is 10
	// overviewXAxis provides a shortcut to overviewSciChartSurface.xAxes.get(0)
	scichartOverview.overviewXAxis.isVisible = true;
	scichartOverview.overviewXAxis.isInnerAxis = true;
	scichartOverview.overviewXAxis.drawMinorGridLines = false;
	scichartOverview.overviewXAxis.labelProvider.precision = 0;

	// Subscribe to rebuild the chart if any of the ChartSurface is updated and ready
	if (this._onInitSubscription === undefined) {
	    this._onInitSubscription = this.onInit$.subscribe((onInit: boolean) => {
		this.onInit(onInit);
	    });
	}

	return { sciChartSurface: scichartOverview.overviewSciChartSurface };
    }

    private async _initOverview(scichartSurface: SciChartSurface, rootElement: string | HTMLDivElement) {
	const result = await this._createOverview(scichartSurface, rootElement);
	return result;
    }

    private _onInit(onInit: boolean) {
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
