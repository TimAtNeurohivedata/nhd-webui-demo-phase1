import { Subject } from 'rxjs';
import { Injectable } from '@angular/core';

export type ChartOptionsType = {
    dataGenerator: ChartOptionsDataGeneratorType;
    graphLines: ChartOptionsGraphLinesType;
    theme: ChartOptionsThemeType;
};

export enum ChartOptionsDataTypeEnum { SineWave = "SineWave", RandomData = "RandomData", RandomWalk = "RandomWalk", EegFixedData = "EegFixedData" };
export enum ChartOptionsAutoUpdateTypeEnum { Static = "Static", Dynamic = "Dynamic", Stream = "Stream" };

export type ChartOptionsDataGeneratorType = {
    dataType: ChartOptionsDataTypeEnum | string;
    autoUpdateType: ChartOptionsAutoUpdateTypeEnum | string;
    autoUpdateRateMsec: number;
    autoUpdateTimescale: number;
    fifoTotalLength: number;
    fifoTimescale: number;
    xAxisDensity: number;
    yAxisAmplitude: number;
};

export type ChartOptionsGraphLinesType = {
};

export type ChartOptionsThemeType = {
    useNativeSciChartTheme: string | boolean;
};

export let chartOptionsDefault: ChartOptionsType = {
    dataGenerator: { dataType: "SineWave", autoUpdateType: "Static", autoUpdateRateMsec: 50, autoUpdateTimescale: 1, fifoTotalLength: 2000, fifoTimescale: 2, xAxisDensity: 20, yAxisAmplitude: 1 },
    graphLines: {},
    theme: { useNativeSciChartTheme: false },
};

@Injectable({
    providedIn: 'root'
})

export class ChartOptionsService {
    private _chartOptionsSubject = new Subject<void>();

    chartOptions: ChartOptionsType = chartOptionsDefault;
    chartOptions$ = this._chartOptionsSubject.asObservable();

    chartOptionsPartialUpdate(partialChartOptions: Partial<ChartOptionsType>): void {
	this.chartOptions = deepMerge({}, this.chartOptions, partialChartOptions);
	this._chartOptionsSubject.next();
    }

    get streamDataEnabled(): boolean {
	const streamData = this.chartOptions.dataGenerator.autoUpdateType === ChartOptionsAutoUpdateTypeEnum.Stream;
	return streamData;
    }
}

function deepMerge(target: any, ...sources: any[]): any {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                deepMerge(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }
    return deepMerge(target, ...sources);
}

function isObject(item: any) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}
