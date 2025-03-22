sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/export/Spreadsheet",
  ],
  function (Controller, JSONModel, Spreadsheet) {
    "use strict";

    return Controller.extend("com.nlcindia.contact.controller.Directory", {
      onInit: function () {
        var oModel = new JSONModel();
        oModel.loadData("model/directory.json");
        this.getView().setModel(oModel, "directory");

        // Store original data for filtering reset
        this._originalData = null;
        oModel.attachRequestCompleted(this._storeOriginalData.bind(this));

        // Generate dynamic unit tabs
        oModel.attachRequestCompleted(this.generateDynamicTabs.bind(this));
      },

      _storeOriginalData: function () {
        var oModel = this.getView().getModel("directory");
        if (oModel) {
          this._originalData = JSON.parse(JSON.stringify(oModel.getData()));
        }
      },

      generateDynamicTabs: function () {
        var oModel = this.getView().getModel("directory");
        if (!oModel) return;

        var aEmployees = oModel.getData().employees;
        var aUnits = [...new Set(aEmployees.map((emp) => emp.unit))]; // Unique units
        var oTabBar = this.getView().byId("unitTabBar");
        oTabBar.removeAllItems();

        oTabBar.addItem(
          new sap.m.IconTabFilter({ text: "All Units", key: "ALL" })
        );
        aUnits.forEach((unit) => {
          oTabBar.addItem(new sap.m.IconTabFilter({ text: unit, key: unit }));
        });
      },

      onDownload: function () {
        var oModel = this.getView().getModel("directory");
        var sSelectedUnit = this.getView().byId("unitTabBar").getSelectedKey();

        if (!oModel) {
          sap.m.MessageToast.show("No data available");
          return;
        }

        // Filter employees based on the selected tab
        var aData = oModel
          .getData()
          .employees.filter(
            (employee) =>
              sSelectedUnit === "ALL" || employee.unit === sSelectedUnit
          );

        if (aData.length === 0) {
          sap.m.MessageToast.show("No employees to export");
          return;
        }

        // Define columns for the Excel file
        var aColumns = [
          { label: "Name", property: "name" },
          { label: "Designation", property: "designation" },
          { label: "Work", property: "work" },
          { label: "Unit", property: "unit" },
          { label: "Division", property: "division" },
          { label: "CUG", property: "cug_number" },
          { label: "Landline Office", property: "landline_office" },
          { label: "Landline Residence", property: "landline_residence" },
          { label: "NLC Office No", property: "nlc_number_office" },
          { label: "NLC Residence No", property: "nlc_number_residence" },
        ];

        // Configure the Excel export settings
        var oSettings = {
          workbook: { columns: aColumns },
          dataSource: aData,
          fileName: sSelectedUnit + "_Employee_Directory.xlsx",
        };

        // Create and download the Excel file
        var oSheet = new sap.ui.export.Spreadsheet(oSettings);
        oSheet
          .build()
          .then(() => {
            sap.m.MessageToast.show("Download completed");
          })
          .catch((error) => {
            sap.m.MessageToast.show("Error while exporting data");
            console.error(error);
          });
      },

      onTabSelect: function (oEvent) {
        var sKey = oEvent.getParameter("key");
        this.filterEmployees(sKey, "");
      },

      onSearch: function (oEvent) {
        var sQuery = oEvent.getParameter("newValue").toLowerCase();
        var sSelectedUnit = this.getView().byId("unitTabBar").getSelectedKey();
        this.filterEmployees(sSelectedUnit, sQuery);
      },

      filterEmployees: function (sUnit, sQuery) {
        var oModel = this.getView().getModel("directory");
        if (!this._originalData) {
          return;
        }

        var aFilteredData = this._originalData.employees.filter((employee) => {
          return (
            (sUnit === "ALL" || employee.unit === sUnit) &&
            (!sQuery ||
              Object.values(employee).join(" ").toLowerCase().includes(sQuery))
          );
        });

        // Sort by designation
        aFilteredData.sort((a, b) =>
          a.designation.localeCompare(b.designation)
        );

        oModel.setData({ employees: aFilteredData });
      },
    });
  }
);
