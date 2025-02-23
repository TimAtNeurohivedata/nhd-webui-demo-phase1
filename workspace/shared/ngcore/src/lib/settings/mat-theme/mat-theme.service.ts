import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

export type SettingsMatThemeType = { name: string, displayName: string, color: string, backgroundColor: string };
type SysVariable = { name: string; value: string; selectorText: string; }

@Injectable({
    providedIn: 'root'
})

export class SettingsMatThemeService {
    public themeList: SettingsMatThemeType[] = [
	{ name: 'azure-blue', displayName: 'azure-blue', color: '#d7e3ff', backgroundColor: '#fdfbff' },
	{ name: 'cyan-orange', displayName: 'cyan-orange', color: '#004f4f', backgroundColor: '#191c1c' },
	{ name: 'magenta-violet', displayName: 'magenta-violet', color: '#810081', backgroundColor: '#1e1a1d' },
	{ name: 'rose-red', displayName: 'rose-red', color: '#ffd9e1', backgroundColor: '#fffbff' },
	
	{ name: 'search-ai-dark', displayName: 'search-ai-dark', color: 'rgb(31, 45, 65)', backgroundColor: '#101218' },
    ];
    
    private _currentThemeName: string = 'cyan-orange'; // Default theme
    private _reader = new CssVariablesReader();
    private _renderer!: Renderer2;

    constructor(private _rendererFactory: RendererFactory2) {
	this._renderer = this._rendererFactory.createRenderer(null, null);
	this.setThemeName(this._currentThemeName);
    }

    getSysVariableByName(name: string): SysVariable {
	return this._reader.getCssVariableByName(name);
    }

    getSysVariables(): SysVariable[] {
	console.log("MatThemeService getSysVariables()");
	this._reader.getAllCssVariables1(["body"], ["--mat-sys"], true);
	this._reader.printAllCssVariables(["--mat-sys"]);
	return this._reader.sysVariables;
    }

    getThemeName(): string {
	return this._currentThemeName;
    }

    setThemeName(themeName: string): void {
	const body = document.querySelector('body');
	if (body) {
            this._renderer.removeClass(body, this._currentThemeName + '-theme');
            this._renderer.addClass(body, themeName + '-theme');
	}
	this._currentThemeName = themeName;
    }
}

class CssVariablesReader {
    sysVariables: SysVariable[] = [];
    
    private _valueIsColor(value: string) {
	// Simple check for color formats (hex, rgb, rgba, hsl, hsla, color names)
	return /^(#|rgb|hsl|color)/.test(value);
    }

    getCssVariableByName(name: string): any {
	let cssVariable = this.sysVariables.find(sysVariable => sysVariable.name === name);
	return cssVariable;
    }
    
    getAllCssVariables1(selectorTextPatterns: string[], namePatterns: string[], filterColorValues: boolean) {
	// From https://stackoverflow.com/questions/65062831/what-does-getcomputedstyle-return-and-how-to-iterate-over-it	
	const isSameDomain = (styleSheet: any) => {
	    if (!styleSheet.href) {
		return true;
	    }

	    return styleSheet.href.indexOf(window.location.origin) === 0;
	};

	const isStyleRule = (rule: any) => rule.type === 1;

	const getCSSCustomPropIndex = () => {
	    let array = [...document.styleSheets]
			    .filter(isSameDomain)
			    .reduce(
				(finalArr, sheet) =>
				    finalArr.concat(
					[...sheet.cssRules].filter(isStyleRule).reduce((propValArr: any, rule: any) => {
					    const props: any = [...rule.style]
								   .map((propName) => [
								       propName.trim(),
								       rule.selectorText,
								       rule.style.getPropertyValue(propName).trim(),
								   ])
								   .filter(([propName]) => propName.indexOf("--") === 0);
					    return [...propValArr, ...props] as Array<string>;
					}, [] as Array<string>)
				    ),
				[] as Array<Array<string>>
			    )
	    this.sysVariables = [];
	    for (let i = 0 ; i < array.length ; i++) {
		if (!namePatterns.some(searchString => array[i][0].includes(searchString))) {
		    continue;
		}
		if (!selectorTextPatterns.some(searchString => array[i][1] === searchString)) {
		    continue;
		}
		if (filterColorValues && !this._valueIsColor(array[i][2])) {
		    continue;
		}
		this.sysVariables.push({name: array[i][0], value: array[i][2], selectorText: array[i][1]});
	    }
	    return this.sysVariables;
	}

	return getCSSCustomPropIndex();
    }

    getAllCssVariables2(namePatterns: string[], selectorTextPatterns: string[], filterColorValues: boolean) {
	this.sysVariables = [];
	for (let i = 0 ; i < document.styleSheets.length ; i++) {
	    let styleSheet = document.styleSheets[i];
	    let href = styleSheet.href;
	    let cssRules = styleSheet.cssRules;
	    for (let j = 0 ; j < cssRules.length ; j++) {
		let rule = cssRules[j];
		let cssText = rule.cssText;
		if (rule.type != 1) { continue; }
		let selectorText = (rule as any).selectorText;
		let style = (rule as any).style;
		for (let k = 0 ; k < style.length ; k++) {
		    const name = style.item(i);
		    const value = style.getPropertyValue(name);
		    if (!namePatterns.some(searchString => name.includes(searchString))) {
			continue;
		    }
		    this.sysVariables.push({name: name, value: value, selectorText: selectorText});
		}
	    }
	}
	return this.sysVariables;
    }

    printAllCssVariables(namePatterns: string[]) {
	for (let i = 0 ; i < this.sysVariables.length ; i++) {
	    let style = this.sysVariables[i];
	    let name = style.name;
	    let value = style.value;
	    let selectorText = style.selectorText;
	    if (namePatterns.some(searchString => name.includes(searchString))) {
		console.log("name/value/selectorText/i: ", name, value, selectorText, i);
	    }
	}
    }
}
