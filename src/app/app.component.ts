import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';

import { AppService } from './app.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'SENSATMAPP';

  medianRows: any[] = [];
  rows: any[] = [];
  sortedRows: any[] = [];
  filteredRows: any[] = [];
  rowsCopy: any[] = [];

  allColumns: any[] = [];
  headerColumns: any[] = [];
  groupedColumns: any[] = [];
  selectedColumns: any[] = [];
  sortColumns: any[] = [];
  filterColumns: any[] = [];

  sortByColumn: string = '';
  sortByOrder: string = 'asc';

  filterByColumn: string = '';
  filterByValue: string = '';

  dataFetchInProgess = true;
  selectAllChecked = true;

  columns = [
    {
      name: 'Box ID',
      field: 'box_id',
      type: "string",
      selected: true,
    },
    {
      name: 'Sensor Reading ID',
      field: 'id',
      type: "string",
      isRequired: true,
      selected: true,
    },
    {
      name: 'Sensor Name',
      field: 'name',
      type: "string",
      selected: true,
      filter: true,
    },
    {
      name: 'Sensor Type',
      field: 'sensor_type',
      type: "string",
      selected: true,
      sort: true,
      filter: true,
    },
    {
      name: 'Sensor Unit',
      field: 'unit',
      type: "string",
      selected: true,
    },
    {
      name: 'Measuring Range',
      field: 'measuring_range',
      selected: true,
      group: true,
      groupColumns: [
        {
          name: 'Lower Bound',
          field: 'range_l',
          type: "number",
          selected: true,
          parentField: 'measuring_range'
        },
        {
          name: 'Upper Bound',
          field: 'range_u',
          type: "number",
          selected: true,
          parentField: 'measuring_range'
        }
      ]
    },
    {
      name: 'Location',
      field: 'location',
      selected: true,
      group: true,
      groupColumns: [
        {
          name: 'Latitude',
          field: 'latitude',
          type: "number",
          selected: true,
          parentField: 'location'
        },
        {
          name: 'Longitude',
          field: 'longitude',
          type: "number",
          selected: true,
          parentField: 'location'
        }
      ]
    },
    {
      name: 'Sensor Reading Value',
      field: 'reading',
      type: "number",
      selected: true,
    },
    {
      name: 'Sensor Reading Time',
      field: 'reading_ts',
      type: "date",
      selected: true,
      sort: true,
    }
  ];

  medianColumns = [
    {
      name: 'Box',
      field: 'id',
    },
    {
      name: 'Sensor Type',
      field: 'sensor_type',
    },
    {
      name: 'Median',
      field: 'median',
    },
    {
      name: 'Unit',
      field: 'unit',
    }
  ]

  constructor(private appService: AppService, private datePipe: DatePipe) {}

  ngOnInit() {
    this.columns.forEach((col: any) => {
      if(col.group) {
        col.noOfGroupColumns = col.groupColumns.length;
        this.allColumns.push(...col.groupColumns);
      } else {
        this.allColumns.push(col);
      }
    });
    this.findSelectedColumns();
    this.appService.getTableData().subscribe(
      (response: any) => {
        if (response && response.length > 0) {
          response.forEach(record => {
            record.reading_ts = this.datePipe.transform(record.reading_ts, 'd-MMM-y h:mm a');
          });
          this.medianRows = [...new Set(response.map(x => x.id))].map(x => {
            const record = response.find(y => y.id === x);
            const matchingBoxes: any[] = response.filter(r => r.id === x).map(r => r.reading).sort((a, b) => a - b);
            const middle = Math.floor(matchingBoxes.length / 2);
            let median;

            if (matchingBoxes.length % 2 === 0) {
              median = (matchingBoxes[middle - 1] + matchingBoxes[middle]) / 2;
            } else {
              median = matchingBoxes[middle];
            }
            
            return {
              id: x,
              sensor_type: record.sensor_type,
              median: median,
              unit: record.unit
            }
          });
          console.log('test -> ', this.medianRows);

          this.rows = [...response];
          this.rowsCopy = [...response];
        } else {
          this.rows = []
        }
        this.dataFetchInProgess = false;
      },
      (error) => {
        this.dataFetchInProgess = false;
      }
    );
  }

  applySort() {
    this.dataFetchInProgess = true;
    this.rows = [];
    if(this.filteredRows && this.filteredRows.length > 0) {
      // apply sort on filtered rows
      this.rows = [...this.filteredRows];
    } else {
      this.rows = [...this.rowsCopy];
    }
    
    const selectedSortColumn = this.headerColumns.find(col => col.field === this.sortByColumn);
    if(selectedSortColumn.type === 'date') {
      if(this.sortByOrder === 'asc') {
        this.rows = this.rows.sort((a, b) => {
          return (new Date(a[selectedSortColumn.field]).getTime()) - (new Date(b[selectedSortColumn.field]).getTime());
        });
      } else {
        this.rows = this.rows.sort((a, b) => {
          return (new Date(b[selectedSortColumn.field]).getTime()) - (new Date(a[selectedSortColumn.field]).getTime());
        });
      }
    } else if(selectedSortColumn.type === 'number') {
      if(this.sortByOrder === 'asc') {
        this.rows = this.rows.sort((a, b) => a - b);
      } else {
        this.rows = this.rows.sort((a, b) => b - a);
      }
    } else if(selectedSortColumn.type === 'string') {
      if(this.sortByOrder === 'asc') {
        this.rows = this.rows.sort((a, b) => (a[selectedSortColumn.field]).localeCompare(b[selectedSortColumn.field]));
      } else {
        this.rows = this.rows.sort((a, b) => (b[selectedSortColumn.field]).localeCompare(a[selectedSortColumn.field]));
      }
    }
    this.sortedRows = [...this.rows];
    this.dataFetchInProgess = false;
  }

  clearSort() {
    this.sortByColumn = '';
    this.sortByOrder = 'asc';
    this.sortedRows = [];
    this.rows = [...this.rowsCopy];
  }

  applyFilter() {
    this.dataFetchInProgess = true;
    this.rows = [];
    if(this.sortedRows && this.sortedRows.length > 0) {
      // apply filter on sorted rows
      this.rows = [...this.sortedRows];
    } else {
      this.rows = [...this.rowsCopy];
    }

    if(this.filterByValue) {
      this.rows = this.rows.filter(record => record[this.filterByColumn].toLowerCase().startsWith(this.filterByValue.toLowerCase()));
    }

    this.filteredRows = [...this.rows];
    this.dataFetchInProgess = false;
  }

  clearFilter() {
    this.filterByColumn = '';
    this.filterByValue = '';
    this.filteredRows = [];
    this.rows = [...this.rowsCopy];
  }

  columnSelected($event, selectedColumn) {
    if ($event && $event.target) {
      if ($event.target.checked) {
        selectedColumn.selected = true;
        if(selectedColumn.parentField) {
          this.columns.find((col: any) => col.field === selectedColumn.parentField).selected = true;
        }
      } else {
        selectedColumn.selected = false;
        if(selectedColumn.parentField) {
          const parentColumn = this.columns.find((col: any) => col.field === selectedColumn.parentField);
          const isAnySelectedChild = parentColumn.groupColumns.some(groupedColumn => groupedColumn.selected);
          if(!isAnySelectedChild) {
            this.columns.find((col: any) => col.field === selectedColumn.parentField).selected = false;
          }
        }
      }
      this.findSelectedColumns();
    }
  }

  selectAllColumns($event) {
    if ($event && $event.target) {
      let updateValue;
      if ($event.target.checked) {
        updateValue = true;
      } else {
        updateValue = false;
      }

      this.columns.forEach((col: any) => {
        if(!col.isRequired) {
          if(col.group) {
            col.selected = updateValue;
            col.groupColumns.forEach(groupedColumn => {
              groupedColumn.selected = updateValue;
            });
          } else {
            col.selected = updateValue;
          }
        }
      });
      this.findSelectedColumns();
    }
  }

  findSelectedColumns() {
    this.headerColumns = [];
    this.selectedColumns = [];
    this.groupedColumns = [];
    this.columns.forEach((col: any) => {
      if(col.selected) {
        if(col.group) {
          const columnToGroup = Object.assign({}, col);
          columnToGroup.groupColumns = [];

          col.groupColumns.forEach(groupedColumn => {
            if(groupedColumn.selected) {
              columnToGroup.groupColumns.push(groupedColumn);
              this.groupedColumns.push(groupedColumn);
              this.selectedColumns.push(groupedColumn);
            }
          });
          columnToGroup.noOfGroupColumns = columnToGroup.groupColumns.length;
          this.headerColumns.push(columnToGroup);
        } else {
          this.selectedColumns.push(col);
          this.headerColumns.push(col);
        }
      }
    });
    this.sortColumns = this.columns.filter(col => col.sort);
    this.filterColumns = this.columns.filter(col => col.filter);
    console.log('this.groupedColumns -> ', this.groupedColumns);
    console.log('this.sortColumns -> ', this.sortColumns);
    console.log('this.filterColumns -> ', this.filterColumns);
    console.log('this.allColumns -> ', this.allColumns);
    console.log('this.headerColumns -> ', this.headerColumns);
  }
}
