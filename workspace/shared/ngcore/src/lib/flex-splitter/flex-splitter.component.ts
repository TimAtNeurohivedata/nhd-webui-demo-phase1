import { Component, ElementRef, Input, ViewChild } from '@angular/core';

@Component({
  selector: 'nhd-ngcore-flex-splitter-horizontal',
  standalone: false,
  
  template: `
    <div id="flex-splitter-container" data-flex-splitter-horizontal>
      <ng-content></ng-content>
    </div>
  `,
  styleUrls: ['./flex-splitter.component.css'],
})

export class FlexSplitterHorizontalComponent {}

@Component({
  selector: 'nhd-ngcore-flex-splitter-seperator',
  standalone: false,
  
  template: `
    <div #separator role="separator" (pointerdown)="this.__eventPointerDown($event)">
      <div class="separator-toggle-lines"></div>
      <ng-container *ngIf="this.__paneDirection !== undefined">
        <div id="separator-toggle-left"
             [innerHtml]="this.__paneArrowUnicode"
             (click)="this.__eventClick($event)">
        </div>
      </ng-container>
      <div class="separator-toggle-lines"></div>
    </div>
  `,
  styleUrls: [
    './flex-splitter.component.css',
  ],
})

export class FlexSplitterSeperatorComponent {
  @Input('paneDirection') __paneDirection!: string;
  @Input('paneOpen') __paneOpen: boolean = false;
  @ViewChild('separator') __separator!: ElementRef;

  __togglePaneOpen: boolean = false;
  __paneArrowUnicode: string = '';

  private _manualResize: boolean = false;
  private _pane1!: HTMLElement;
  private _pane1WidthInitial: number = 0;
  private _pane2!: HTMLElement;
  private _pane2FlexInitial: string = '';
  private _pane2WidthInitial: number = 0;

  constructor(private _elRef: ElementRef) {
  }

  ngOnInit() {
    // Remove the host binding
    RemoveHostDirective(this._elRef);

    // Update the pane toggle state
    this.__togglePaneOpen = this.__paneOpen;
    this._updatePaneArrow();
  }

  ngAfterViewInit() {
    // Get the initial pane elements from the DOM
    let separator: HTMLElement = this.__separator.nativeElement;
    this._pane1 = separator.previousElementSibling as HTMLElement;
    this._pane2 = separator.nextElementSibling as HTMLElement;

    // Get the initial pane widths from the computed styles
    // Note that these need to be rounded up to avoid overflow
    const pane1ComputedStyle = getComputedStyle(this._pane1)
    const pane2ComputedStyle = getComputedStyle(this._pane2)
    this._pane1WidthInitial = Math.round(parseFloat(pane1ComputedStyle.width));
    this._pane2FlexInitial = pane2ComputedStyle.flex;
    this._pane2WidthInitial = Math.round(parseFloat(pane2ComputedStyle.width));

    // Update the pane toggle state
    this.__togglePaneOpen = this.__paneOpen;
    this._eventFlexSplitterTogglePane();
  }

  __eventClick(event: any): void {
    // Update the pane toggle state
    this.__togglePaneOpen = !this.__togglePaneOpen;
    this._eventFlexSplitterTogglePane();
  }

  __eventPointerDown(event: any): void {
    // Process the pointer down event
    this._eventPointerDown(event);
  }

  private _eventFlexSplitterTogglePane() {
    this._eventFlexSplitterTogglePaneHorizontal(
      this.__togglePaneOpen, this.__separator.nativeElement
    );
  }

  private _eventFlexSplitterTogglePaneHorizontal(paneOpen: boolean, separator: HTMLElement) {
    this._updatePaneArrow();

    const container = separator.parentElement;
    if (!container || separator.getAttribute('role') !== 'separator') {
      return
    }
    const horizontal = container.hasAttribute('data-flex-splitter-horizontal')
    if (!horizontal) {
      return
    }

    const pane1 = separator.previousElementSibling as HTMLElement
    const pane2 = separator.nextElementSibling as HTMLElement
    const pane1ComputedStyle = getComputedStyle(pane1)
    const pane2ComputedStyle = getComputedStyle(pane2)
    const pane1Rect = pane1.getBoundingClientRect()

    const pane1Pos = pane1Rect.left;
    const totalSize = pane1.offsetWidth + pane2.clientWidth
    const pane1MinSize = Math.max(
      parseInt(pane1ComputedStyle.minWidth!, 10) ||
        0, totalSize - (parseInt(pane2ComputedStyle.maxWidth!, 10) || totalSize)
    );
    const pane1MaxSize = Math.min(
      parseInt(pane1ComputedStyle.maxWidth!, 10) ||
        totalSize, totalSize - (parseInt(pane2ComputedStyle.minWidth!, 10) || 0)
    );
    if (this.__paneDirection === 'left') {
      if (!paneOpen) {
        const pane1Size = pane1MinSize;
        pane1.style.width = pane1Size + 'px'
        pane2.style.width = totalSize - pane1Size + 'px'
      }
      else {
        const pane1Size = this._pane1WidthInitial;
        pane1.style.width = pane1Size + 'px'
        pane2.style.width = totalSize - pane1Size + 'px'
      }
    }
    if (this.__paneDirection === 'right') {
      // If the panel has been manually resized then manually set the widths
      // If the panel has not been manually resized then allow flexbox to determine the widths
      if (this._manualResize) {
        if (!paneOpen) {
          const pane2Size = Math.round(parseInt(pane2ComputedStyle.minWidth!, 10) || 0);
          pane2.style.width = pane2Size + 'px'
          pane1.style.width = totalSize - pane2Size + 'px'
        }
        else {
          const pane2Size = this._pane2WidthInitial;
          pane2.style.width = pane2Size + 'px'
          pane1.style.width = totalSize - pane2Size + 'px'
        }
      }
      else {
        if (!paneOpen) {
          // Configure flex to size this panel with zero width
          pane2.style.flex = '0 0 0%';
        }
        else {
          // Configure flex to use the panels intial flex settings
          pane2.style.flex = this._pane2FlexInitial;
        }
      }
    }
  }

  private _eventPointerDown(pointerDownEvent: PointerEvent): void {
    const separator = pointerDownEvent.target as HTMLElement
    const container = separator.parentElement
    if (!container ||
        !pointerDownEvent.isPrimary ||
        pointerDownEvent.button !== 0 ||
        separator.getAttribute('role') !== 'separator') {
      return
    }
    const vertical = container.hasAttribute('data-flex-splitter-vertical')
    const horizontal = container.hasAttribute('data-flex-splitter-horizontal')
    if (!vertical && !horizontal) {
      return
    }
    // prevent text selection
    pointerDownEvent.preventDefault()

    const pointerId = pointerDownEvent.pointerId
    const pane1 = separator.previousElementSibling as HTMLElement
    const pane2 = separator.nextElementSibling as HTMLElement
    const pane1ComputedStyle = getComputedStyle(pane1)
    const pane2ComputedStyle = getComputedStyle(pane2)
    const pane1Rect = pane1.getBoundingClientRect()

    let onPointerMove: (event: PointerEvent) => void
    if (vertical) {
      const pane1Pos = pane1Rect.top + pointerDownEvent.offsetY
      const totalSize = pane1.offsetHeight + pane2.offsetHeight
      const pane1MinSize = Math.max(
        parseInt(pane1ComputedStyle.minHeight!, 10) ||
          0, totalSize - (parseInt(pane2ComputedStyle.maxHeight!, 10) ||totalSize)
      )
      const pane1MaxSize = Math.min(
        parseInt(pane1ComputedStyle.maxHeight!, 10) ||
          totalSize, totalSize - (parseInt(pane2ComputedStyle.minHeight!, 10) || 0)
      )
      onPointerMove = event => {
        if (event.pointerId === pointerId) {
          const pane1Size = Math.round(
            Math.min(Math.max(event.clientY - pane1Pos, pane1MinSize), pane1MaxSize)
          )
          pane1.style.height = pane1Size + 'px'
          pane2.style.height = totalSize - pane1Size + 'px'
          this._manualResize = true;
        }
      }
    }
    else {
      const pane1Pos = pane1Rect.left + pointerDownEvent.offsetX
      const totalSize = pane1.offsetWidth + pane2.clientWidth
      const pane1MinSize = Math.max(
        parseInt(pane1ComputedStyle.minWidth!, 10) ||
          0, totalSize - (parseInt(pane2ComputedStyle.maxWidth!, 10) || totalSize)
      )
      const pane1MaxSize = Math.min(
        parseInt(pane1ComputedStyle.maxWidth!, 10) ||
          totalSize, totalSize - (parseInt(pane2ComputedStyle.minWidth!, 10) || 0)
      )
      onPointerMove = event => {
        if (event.pointerId === pointerId) {
          const pane1Size = Math.round(
            Math.min(Math.max(event.clientX - pane1Pos, pane1MinSize), pane1MaxSize)
          )
          pane1.style.width = pane1Size + 'px'
          pane2.style.width = totalSize - pane1Size + 'px'
          this._manualResize = true;
       }
      }
    }

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerId === pointerId) {
        separator.releasePointerCapture(pointerId)
        separator.removeEventListener('pointermove', onPointerMove)
        separator.removeEventListener('pointerup', onPointerUp)
        separator.removeEventListener('pointercancel', onPointerUp)
      }
    }

    onPointerMove(pointerDownEvent)
    pane1.style.flexShrink = pane2.style.flexShrink = 1 as any

    separator.addEventListener('pointercancel', onPointerUp)
    separator.addEventListener('pointerup', onPointerUp)
    separator.addEventListener('pointermove', onPointerMove)
    separator.setPointerCapture(pointerId)
  }

  private _updatePaneArrow(): void {
    // Update the pane arrow based on the pane direction and pane open toggle state
    if (this.__paneDirection === 'left') {
      if (this.__togglePaneOpen) {
        this.__paneArrowUnicode = '&#x25c0;'
      }
      else {
        this.__paneArrowUnicode = '&#x25b6;'
      }
    }
    if (this.__paneDirection === 'right') {
      if (this.__togglePaneOpen) {
        this.__paneArrowUnicode = '&#x25b6;'
      }
      else {
        this.__paneArrowUnicode = '&#x25c0;'
      }
    }
  }
}

export function RemoveHostDirective(elRef: ElementRef) {
  let nativeElement: HTMLElement = elRef.nativeElement;
  let parentElement: HTMLElement = nativeElement.parentElement!;

  // move all children out of the element while
  while (nativeElement.firstChild) {
    parentElement.insertBefore(nativeElement.firstChild, nativeElement);
  }

  // remove the empty element(the host)
  parentElement.removeChild(nativeElement);
}
