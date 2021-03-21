import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-data-table',
  templateUrl: 'data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
})
export class DataTableComponent implements OnInit, OnChanges {
  @Input() headerColumns: any[] = [];
  @Input() groupedColumns: any[] = [];
  @Input() allColumns: any[] = [];
  @Input() rows: any[] = [];
  @Input() pageSize: any[] = [5, 10, 25, 50, 100];

  selectedPageSize = 5;
  displayRows: any[] = [];
  pageInfo: any = {};
  curPage = -1;
  noRows = false;
  totalNoOfColumns: number;

  ngOnInit() {
    this.totalNoOfColumns = this.allColumns.length;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes) {
      console.log('changes =>', changes);

      if (changes.columns) {
        this.selectedPageSize = 5;
      }

      if (this.rows.length > 0) {
        this.noRows = false;
        this.updatePageSize(this.selectedPageSize);
      } else {
        this.noRows = true;
      }
    }
  }

  updatePageSize($event) {
    console.log('updating page size');

    this.selectedPageSize = $event;

    // whenever number of records per page changes, navigate user to first page
    this.setPage(1);
  }

  setPage(page: number) {
    this.curPage = page;

    // get pager object from service
    this.pageInfo = this.getPaginationMetadata(this.rows.length, page, this.selectedPageSize);
    this.displayRows = this.rows.slice(this.pageInfo.startIndex, this.pageInfo.endIndex + 1);
  }

  getPaginationMetadata(totalItems: number, currentPage: number = 1, pageSize: number = 5) {
    // calculate total pages
    const totalPages = Math.ceil(totalItems / pageSize);

    // ensure current page isn't out of range
    if (currentPage < 1) {
      currentPage = 1;
    } else if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    let startPage: number;
    let endPage: number;
    if (totalPages <= 10) {
      // less than 10 total pages so show all
      startPage = 1;
      endPage = totalPages;
    } else {
      // more than 10 total pages so calculate start and end pages
      if (currentPage <= 6) {
        startPage = 1;
        endPage = 10;
      } else if (currentPage + 4 >= totalPages) {
        startPage = totalPages - 9;
        endPage = totalPages;
      } else {
        startPage = currentPage - 5;
        endPage = currentPage + 4;
      }
    }

    // calculate start and end item indexes
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + (pageSize - 1), totalItems - 1);

    // create an array of pages to ng-repeat in the pager control
    const pages = Array.from(Array(endPage + 1 - startPage).keys()).map((i) => startPage + i);

    // return object with all pager properties required by the view
    return {
      totalItems,
      currentPage,
      pageSize,
      totalPages,
      startPage,
      endPage,
      startIndex,
      endIndex,
      pages,
    };
  }
}
