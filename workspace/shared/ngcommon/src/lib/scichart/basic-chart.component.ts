import { Subscription } from 'rxjs';
import { Component } from '@angular/core';

import { ScichartAngularComponent } from "scichart-angular";
import { SciChartJsNavyTheme } from 'scichart';
import { SciChartSurface, TSciChart } from 'scichart';
import { EAxisAlignment, NumericAxis } from 'scichart';

@Component({
    selector: 'nhd-ngcommon-scichart-basic-chart',
    imports: [ScichartAngularComponent],
    standalone: true,

    template: `<scichart-angular [initChart]="initChart"></scichart-angular>`,
})

export class BasicChartComponent {
    initChart: any;
    
    private _scichartRootElement!: string | HTMLDivElement;
    private _scichartSurface!: SciChartSurface;
    private _scichartTheme: SciChartJsNavyTheme = new SciChartJsNavyTheme();
    private _scichartWasmContext!: TSciChart;
    
    constructor() {
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

	// Apply theme varaibles to the SciChartSurface
	this._scichartSurface.title = "BasicChartCompenent";

	// Call the funtions to create the other SciChart components that go with SciChartSurface
	this._createChartXAxes();
	this._createChartYAxes();

	// Return the values expected for the <scichart-angular> [initChart] property binding function
	return { sciChartSurface, wasmContext };
    }

    private _createChartXAxes() {
	// Create the first x-axis
	const xAxis = new NumericAxis(this._scichartWasmContext, {
	    axisTitleStyle: { color: "#EEEEEE" },
	    axisTitle: "X Axis",
	    axisBorder: {
		borderTop: 1,
		color: "#EEEEEE" // Green color
	    },
	    backgroundColor: "#EEEEEE11",
	});
	this._scichartSurface.xAxes.add(xAxis);
    }

    private _createChartYAxes() {
	// Create the left y-axis
	const leftYAxis = new NumericAxis(this._scichartWasmContext, {
	    axisAlignment: EAxisAlignment.Left,
	    axisTitleStyle: { color: "#228B22" },
	    axisTitle: "Left Axis",
	    axisBorder: {
		borderRight: 1,
		color: "#228B22" // Green color
	    },
	    backgroundColor: "#228B2222"
	});
	this._scichartSurface.yAxes.add(leftYAxis);

	// Create the right y-axis
	const rightYAxis = new NumericAxis(this._scichartWasmContext, {
	    axisTitleStyle: { color: "#368BC1" },
	    id: "RightAxis",
	    axisTitle: "Right Axis",
	    axisBorder: {
		borderLeft: 1,
		color: "#368BC1" // Blue color
	    },
	    backgroundColor: "#368BC111"
	});
	this._scichartSurface.yAxes.add(rightYAxis);
    }

    private async _initChart(rootElement: string | HTMLDivElement) {
	this._scichartRootElement = rootElement;
	const result = await this._createChartSurface(rootElement);
	return result;
    }
}
