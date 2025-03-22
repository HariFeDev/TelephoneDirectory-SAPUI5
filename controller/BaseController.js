/*global history */
sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/m/MessageBox",
  ],
  function (Controller, History, MessageBox) {
    "use strict";

    var rolesList = []; //list of roles
    var loginName;
    return Controller.extend("com.nlcindia.contact.controller.BaseController", {
      addRole: function (roleCode) {
        rolesList.push(roleCode);
      },

      getRoles: function () {
        return rolesList;
      },

      logRoles: function () {
        for (var i = 0; i < rolesList.length; i++) {
          console.log(rolesList[i]);
        }
      },

      onCheckAuth: function () {
        if (localStorage.getItem("response") !== "OK") {
          oRouter.navTo("rLogin");
          location.reload();
        }
      },

      /*
        hasRole: function(roleCode) {
        return rolesList.includes(roleCode);
        },
         */

      hasRole: function (roleCode) {
        try {
          if (localStorage.length === 0) {
            //console.log('No Session Found');
            return rolesList.includes(roleCode);
          } else {
            //console.log('Session Found. Item Count ' + localStorage.length );
            return localStorage.getItem("roles").includes(roleCode);
          }
        } catch (err) {
          //console.log(err);
        }
      },

      getLoginName: function () {
        return loginName;
      },

      setLoginName: function (sValue) {
        loginName = sValue;
      },

      getLoggedUserCpf: function () {
        var ses = this.getSession();
        var cpf = "";
        if (ses.hasOwnProperty("cpfNo")) {
          cpf = ses.cpfNo;
        }
        return cpf;
      },

      getSession: function () {
        var ses = {};
        var kid = this.getKid();
        try {
          if (localStorage.hasOwnProperty(kid)) {
            ses = JSON.parse(localStorage.getItem(kid));
          }
        } catch (err) {
          Log.error("Error getting user session. " + err);
        }
        return ses;
      },

      getAppId: function () {
        return "";
      },
      getKid: function () {
        return "uid" + this.getAppId();
      },
      getAccessToken: function () {
        var ses = this.getSession();
        var token = "";
        if (ses.hasOwnProperty("access_token")) {
          token = ses.access_token;
        }
        return token;
      },

      getWsURL: function () {
        if (userLoc === "intranet") {
          return "http://nlcui5.nlcindia.com/essmss/";
        } else {
          return "http://210.212.241.79:8080/dataasservice/";
        }
      },
      getOdataURL: function () {
        if (userLoc === "intranet") {
          return "http://api.nlcindia.com/nlcilapi/odataProxy/";
        } else {
          return "http://210.212.241.79:8080/dataasservice/odataProxy/";
        }
      },

      getDataServiceURL: function () {
        if (userLoc === "intranet") {
          return "http://172.16.25.52:9888/dataasservice/";
        } else {
          return "http://210.212.241.79:8080/dataasservice/";
        }
      },

      getUiVisibleFlag: function (app) {
        if (app === "Claim") {
          return true;
        } else if (app === "Loan") {
          return false;
        } else if (app === "Regn") {
          return true;
        }
      },

      getUiEditableFlag: function (app) {
        if (app === "Claim") {
          return true;
        } else if (app === "Loan") {
          return false;
        } else if (app === "Regn") {
          return true;
        }
      },

      getTestMsgText: function () {
        return "Development under progress";
      },

      getResourcesURL: function () {
        return "/intranet/www/resources/";
      },

      getValidationURL: function () {
        //console.log(userLoc);
        if (userLoc === "intranet") {
          //return "http://api.nlcindia.com/";
          //return "http://172.16.4.55:8080/";
          return "http://172.16.25.52:9999/";
          //return "http://localhost:8080/";
        } else {
          return "http://210.212.241.79:8080/intgw/";
        }
      },

      getNlcilApiUrl: function () {
        //console.log(userLoc);
        if (userLoc === "intranet") {
          return "http://api.nlcindia.com/nlcilapi/";
        } else {
          return "http://210.212.241.79:8080/intgw/";
        }
      },

      onConvertDateToString: function (dateToConvert) {
        var day = dateToConvert.getDate();
        var month = dateToConvert.getMonth() + 1; // getMonth() is zero-based
        var year = dateToConvert.getFullYear();

        // Ensuring two digits for day and month
        day = day < 10 ? "0" + day : day;
        month = month < 10 ? "0" + month : month;

        return `${year}-${month}-${day}`;
      },

      onShowNetworkFailedMsgBox: function () {
        MessageBox.show("Unable to Connect to Internet. Please Retry", {
          icon: MessageBox.Icon.INFORMATION,
          title: "Network Error",
          actions: [MessageBox.Action.OK],
        });
      },

      onShowMsgBox: function (msg) {
        MessageBox.show(msg, {
          icon: MessageBox.Icon.INFORMATION,
          title: "Message",
          actions: [MessageBox.Action.OK],
        });
      },

      onShowErrorMsgBox: function (msg) {
        MessageBox.show(msg, {
          icon: MessageBox.Icon.ERROR,
          title: "Message",
          actions: [MessageBox.Action.OK],
        });
      },

      showErrorMsg: function (msg, title, fnCallback) {
        title = title ? title : "Error";
        if (typeof fnCallback === "function") {
          MessageBox.show(msg, {
            icon: MessageBox.Icon.ERROR,
            title: title,
            actions: [MessageBox.Action.OK],
            emphasizedAction: MessageBox.Action.OK,
            onClose: fnCallback,
          });
        } else {
          MessageBox.show(msg, {
            icon: MessageBox.Icon.ERROR,
            title: title,
            actions: [MessageBox.Action.OK],
          });
        }
      },

      onShowSuccessMsgBox: function (msg, title, fnCallback) {
        title = title ? title : "Success";
        if (typeof fnCallback === "function") {
          MessageBox.show(msg, {
            icon: MessageBox.Icon.SUCCESS,
            title: title,
            actions: [MessageBox.Action.OK],
            emphasizedAction: MessageBox.Action.OK,
            onClose: fnCallback,
          });
        } else {
          MessageBox.show(msg, {
            icon: MessageBox.Icon.SUCCESS,
            title: title,
            actions: [MessageBox.Action.OK],
          });
        }
      },
      onLogOut: function () {
        localStorage.clear();
        this.getOwnerComponent().getRouter().navTo("rLogin");
        location.reload();
      },
      getRbacRoles: function () {
        var ses = this.getSession();
        var token = "";
        if (ses.hasOwnProperty("rbacRoles")) {
          return ses.rbacRoles;
        } else {
          return [];
        }
      },
      hasRbacRole: function (roleCode) {
        var roles = this.getRbacRoles();
        console.log(roles);
        console.log(roles.some((roleObj) => roleObj.role === roleCode));
        return roles.some((roleObj) => roleObj.role === roleCode);
      },
      getAccessUnits: function (roleCode) {
        var accessUnits = [];
        var roles = this.getRbacRoles();
        roles.forEach((roleObj) => {
          if (roleObj.hasOwnProperty("pa") && roleObj.hasOwnProperty("role")) {
            if (roleObj.role === roleCode) {
              accessUnits.push(roleObj.pa);
            }
          }
        });
        return accessUnits;
      },

      /**
       * Convenience method for accessing the router in every controller of the application.
       * @public
       * @returns {sap.ui.core.routing.Router} the router for this component
       */
      getRouter: function () {
        return this.getOwnerComponent().getRouter();
      },

      /**
       * Convenience method for getting the view model by name in every controller of the application.
       * @public
       * @param {string} sName the model name
       * @returns {sap.ui.model.Model} the model instance
       */
      getModel: function (sName) {
        return this.getView().getModel(sName);
      },

      /**
       * Convenience method for setting the view model in every controller of the application.
       * @public
       * @param {sap.ui.model.Model} oModel the model instance
       * @param {string} sName the model name
       * @returns {sap.ui.mvc.View} the view instance
       */
      setModel: function (oModel, sName) {
        return this.getView().setModel(oModel, sName);
      },

      /**
       * Convenience method for getting the resource bundle.
       * @public
       * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
       */
      getResourceBundle: function () {
        return this.getOwnerComponent().getModel("i18n").getResourceBundle();
      },

      /**
       * Event handler when the share button has been clicked
       * @param {sap.ui.base.Event} oEvent the butten press event
       * @public
       */
      onSharePressed: function (oEvent) {
        var oShareSheet = this.getView().byId("shareSheet");
        oShareSheet.openBy(oEvent.getSource());
      },

      /**
       * Event handler  for navigating back.
       * It checks if there is a history entry. If yes, history.go(-1) will happen.
       * If not, it will replace the current entry of the browser history with the master route.
       * @public
       */

      /*
         access the navigation history and try to determine the previous hash. 
         In contrast to the browser history, we will get a valid result only if a navigation step inside our app has already happened. 
         Then we will simply use the browser history to go back to the previous page. 
         
         If no navigation has happened before, we can tell the router to go to our overview page directly. 
         The second parameter true tells the router to replace the current history state with the new one since we actually do a back navigation by ourselves.
         This implementation is a bit better than the browser’s back button for our use case. 
         The browser would simply go back one step in the history even though we were on another page outside of the app. 
         
         In the app, we always want to go back to the overview page even if 
         we came from another link or 
         opened the detail page directly with a bookmark. 
         You can try it by loading the detail page in a new tab directly and clicking on the back button in the app, 
         it will still go back to the overview page.
         */
      navBack: function () {
        var sPreviousHash = History.getInstance().getPreviousHash();

        if (sPreviousHash === undefined) {
          console.log("No Previous Hash. Going to Home Page");
          var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
          oRouter.navTo("DashBoard", {}, true);
        } else {
          console.log(
            "Previous Hash " + sPreviousHash + " :: Navigating -1 History"
          );
          window.history.go(-1);
        }
      },

      onBeforeRendering: function () {},
      onAfterRendering: function () {},
      onExit: function () {},
    });
  }
);
