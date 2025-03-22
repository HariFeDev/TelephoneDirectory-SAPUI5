/*Adding component.js file in SAP ui5 application is an important structural change for the better. 
 * With this we eliminate the dependency on index.html file and make our app flexible enough so that it can be launched from the SAP fiori Launchpad. 
 * Remember that SAP fiori Launchpad will launch your application via the component file and not the index.html file. 
 * The bootstrapping is now taken care by the Fiori Launchpad itself.
 * The SAP Fiori Launchpad behaves like an application container and it does not need the index.html file with the bootstrap to instantiate the application.  
 * Whenever we access resources, we will now do it relative to the component file instead of the index.html file. 
 * The component file is reusable and encapsulates all UI assets and are independent from the index.html file.
 https://www.amarmn.com/sapui5-component-js-file-and-sapui5-manifest-file-part-3-sapui5-programming-for-beginners */

/* The Component.js file has two important parts:
(i) The metadata section. 
It has property key manifest and value json.
This prpotry calls the manifest.json file which is also know as the app descriptor file. 
It holds all app level configuration and helps keep Component file clean thereby clearly separationg application coding from configuration settings.

(ii) Another section of component file is the init function that is called when the component is initialized. 
When the component is instantiated, the init function is automatically invoked.
*/

/*/* 
we will instantiate all models for our application inside the manifest file. 
The model instantiated in manifest file are directly set on the component and not on the root view. 
The good part is that because the controls are nested, it automatically inherits the models from their parent, 
hence the models will be available to view as well.
*/

/*
The manifest.json file has three sections defined by namespaces: sap.app, sap.ui and sap.ui5.
(i) Sap.app holds the General settings like id, type, i18n, title, description, applicationVeriosn,
(ii) Sap.ui Specifies the Ui technology (in our case it is SAPUI5) and devices types(desktop, tablet, phone).
(iii) Sap.ui5 namespace holds most important parameters for the application.
 */
sap.ui.define(
  [
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "./model/models",
    "./controller/utilities",
    "sap/ui/model/json/JSONModel",
  ],
  function (UIComponent, Device, models, utilities, JSONModel) {
    "use strict";

    return UIComponent.extend("com.nlcindia.contact.Component", {
      /* The component is initialized by UI5 automatically during the startup of the app and calls the init method once. */
      init: function () {
        var mConfig = this.getMetadata().getConfig();

        // always use absolute paths relative to our own component
        // (relative paths will fail if running in the Fiori Launchpad)
        var sRootPath = jQuery.sap.getModulePath("com.nlcindia.contact");

        this.setModel(
          models.createResourceModel(sRootPath, mConfig.resourceBundle),
          "i18n"
        );
        this.setModel(models.createDeviceModel(), "device");

        var oDirectoryModel = new JSONModel("model/directory.json");
        this.setModel(oDirectoryModel, "directory");

        // call super init (will call function "create content")
        UIComponent.prototype.init.apply(this, arguments);
        this.getRouter().initialize(); // initialize router and navigate to the first page
      },

      createContent: function () {
        // call the base component's createContent function
        var oRootView = UIComponent.prototype.createContent.apply(
          this,
          arguments
        );
        oRootView.addStyleClass(utilities.getContentDensityClass());
        return oRootView;
      },

      /* The component is destroyed by UI5 automatically. In this method, the other JSON models are destroyed. */
      destroy: function () {
        this.getModel().destroy();
        this.getModel("i18n").destroy();
        this.getModel("device").destroy();
        // call the base component's destroy function
        UIComponent.prototype.destroy.apply(this, arguments);
      },

      /* Creates a promise which is resolved when the metadata is loaded. */
      _createMetadataPromise: function (oModel) {
        this.oWhenMetadataIsLoaded = new Promise(function (fnResolve) {
          oModel.attachEventOnce("metadataLoaded", fnResolve);
          // to guarantee upward compatibility to 1.30, metdataFailed is never thrown.
          // oModel.attachEventOnce("metadataFailed", fnReject);
        });
      },

      metadata: {
        rootView: "com.nlcindia.contact.view.App",
        manifest: "json", //Component file calls the manifest file and we keep all app level configuration inside the manifest file
        includes: ["css/shopStyles.css"],

        dependencies: {
          libs: [
            "sap.m",
            "sap.me",
            "sap.ushell",
            "sap.ui.comp",
            "sap.viz",
            "sap.ui.layout",
          ],
          components: [],
        },

        config: {
          resourceBundle: "i18n/i18n_en_US.properties",
        },

        routing: {
          config: {
            routerClass: "sap.m.routing.Router", // use the router in sap.m library which provides enhanced features
            viewType: "XML",
            viewPath: "com.nlcindia.contact.view",
            controlId: "fioriContent", // This is the control in which new views are placed (sap.m.App in
            transition: "slide", //,
            // bypassed: {
            //    target: "tgtNotFound"
            // }
          },

          routes: [
            {
              name: "rLogin",
              pattern: "Login",
              target: "tgtLogin",
            },
            {
              pattern: "DashBoard",
              name: "rDashBoard",
              target: "tgtDashBoard",
            },
            {
              pattern: "Directory",
              name: "rDirectory",
              target: "tgtDirectory",
            },
          ],
          targets: {
            tgtEmptyPage: {
              viewName: "EmptyPage",
              controlAggregation: "pages",
            },
            tgtLogin: {
              viewName: "App",
              controlAggregation: "pages",
            },
            tgtDashBoard: {
              viewName: "DashBoard",
              controlAggregation: "pages",
            },
            tgtDirectory: {
              viewName: "Directory",
              controlAggregation: "pages",
            },
          },
        },
      },
    });
  }
);
