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

        // Define the hierarchy order (Head to Bottom)
        var aDesignationOrder = [
          "CMD",
          "Director (Finance)",
          "Director (Human Resources)",
          "Director (Mines)",
          "Director (Power)",
          "CVO",
          "CS",
          "ED",
          "GM - Mines",
          "DGM - Mines",
          "AGM - Mines",
          "CM - Mines",
          "Sr. Mgr - Mines",
          "Mgr - Mines",
          "Dy. Mgr - Mines",
          "Asst. Mgr - Mines",
          "ME",
          "Geo.",
          "SO",
          "Sup./Frm.",
          "EO",
          "Mnr.",
          "SS",
          "GM - Thermal",
          "DGM - Thermal",
          "AGM - Thermal",
          "CM - Thermal",
          "Sr. Mgr - Thermal",
          "Mgr - Thermal",
          "Dy. Mgr - Thermal",
          "Asst. Mgr - Thermal",
          "Engr.",
          "Tech.",
          "SO",
          "Sup.",
          "Opr.",
          "SS",
        ];

        // Sort the filtered data based on the designation hierarchy
        aFilteredData.sort((a, b) => {
          let indexA = aDesignationOrder.indexOf(a.designation);
          let indexB = aDesignationOrder.indexOf(b.designation);

          // Handle thermal units separately
          const isThermalUnitA = a.unit.includes("Thermal");
          const isThermalUnitB = b.unit.includes("Thermal");

          if (isThermalUnitA && isThermalUnitB) {
            // Ensure thermal designations are sorted correctly
            if (indexA === -1) indexA = aDesignationOrder.length;
            if (indexB === -1) indexB = aDesignationOrder.length;
            return indexA - indexB;
          } else if (isThermalUnitA) {
            // If 'a' is from a thermal unit, prioritize it
            return -1;
          } else if (isThermalUnitB) {
            // If 'b' is from a thermal unit, prioritize it
            return 1;
          } else {
            // For non-thermal units, use the default sorting
            if (indexA === -1) indexA = aDesignationOrder.length;
            if (indexB === -1) indexB = aDesignationOrder.length;
            return indexA - indexB;
          }
        });

        // Ensure "SO" and "SS" are at the bottom for thermal units
        if (sUnit === "ALL" || sUnit.includes("Thermal")) {
          aFilteredData.sort((a, b) => {
            const isSOorSSA = a.designation === "SO" || a.designation === "SS";
            const isSOorSSB = b.designation === "SO" || b.designation === "SS";

            if (isSOorSSA && isSOorSSB) {
              return 0; // Both are "SO" or "SS", no change in order
            } else if (isSOorSSA) {
              return 1; // Move "SO" or "SS" to the bottom
            } else if (isSOorSSB) {
              return -1; // Move "SO" or "SS" to the bottom
            } else {
              return 0; // No change for other designations
            }
          });
        }

        oModel.setData({ employees: aFilteredData });
      },
    });
  }
);
