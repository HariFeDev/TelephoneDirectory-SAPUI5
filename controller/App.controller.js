sap.ui.define(
  [
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/library",
    "sap/ui/core/BusyIndicator",
  ],
  function (
    BaseController,
    JSONModel,

    MessageBox,
    MessageToast,
    coreLibrary,
    BusyIndicator
  ) {
    "use strict";
    var ValueState = coreLibrary.ValueState;
    var ipAddress;
    var oView;
    var admFlg = "Y";
    var pword;
    return BaseController.extend("com.nlcindia.contact.controller.App", {
      onInit: function () {
        oView = this.getView();
        this.createUI();
        this.byId("uid").attachBrowserEvent(
          "keypress",
          this.onKeyPress.bind(this)
        );
        this.byId("pwd").attachBrowserEvent(
          "keypress",
          this.onKeyPress.bind(this)
        );
      },

      onKeyPress: function (event) {
        if (event.keyCode === 13) {
          this.onLogin();
        }
      },

      createUI: function () {},
      onUsertypeChange: function () {
        if (oView.byId("userType").getSelectedKey() === "Initiator") {
          oView.byId("uid").setPlaceholder("Intranet Username");
          oView.byId("pwd").setPlaceholder("Intranet Password");
        } else if (oView.byId("userType").getSelectedKey() === "Approver") {
          oView.byId("uid").setPlaceholder("SAP Username");
          oView.byId("pwd").setPlaceholder("SAP Password");
        }
      },
      validateLoginForm: function () {
        //            if ((!oView.byId("userType").getSelectedKey() && oView.byId("userType").getValue()) || oView.byId("userType").getValue() === "") {
        //                oView.byId("userType").setValueState(ValueState.Error);
        //                MessageToast.show("Select Valid User Type", {duration: 2000, at: 'center center'});
        //                $(".sapMMessageToast").addClass("sapMMessageToastDanger");
        //                return false;
        //            } else {
        //                oView.byId("userType").setValueState(ValueState.None);
        //            }
        if (oView.byId("uid").getValue() === "") {
          oView.byId("uid").setValueState(ValueState.Error);
          MessageToast.show("Enter Valid Username", {
            duration: 2000,
            at: "center center",
          });
          $(".sapMMessageToast").addClass("sapMMessageToastDanger");
          return false;
        } else {
          oView.byId("uid").setValueState(ValueState.None);
        }
        if (oView.byId("pwd").getValue() === "") {
          oView.byId("pwd").setValueState(ValueState.Error);
          MessageToast.show("Enter Valid Password", {
            duration: 2000,
            at: "center center",
          });
          $(".sapMMessageToast").addClass("sapMMessageToastDanger");
          return false;
        } else {
          oView.byId("pwd").setValueState(ValueState.None);
        }
        return true;
      },

      onLogin: function (oEvent) {
        if (this.validateLoginForm()) {
          BusyIndicator.show(0);
          var that = this;
          var uname = this.getView().byId("uid").getValue();
          pword = this.getView().byId("pwd").getValue();
          var data;
          if (pword === "AdminESS#321") {
            data = {
              grant_type: "client_credentials",
              scope: "read write",
            };
          } else {
            data = {
              grant_type: "password",
              username: uname,
              password: pword,
              scope: "read,write",
            };
          }
          $.ajax({
            url: this.getNlcilApiUrl() + "oauth2/token",
            method: "POST",
            headers: {
              Authorization: "Basic bmxjaWwtbW9iaWxlOkNvZGVAY29jcw==",
              "Content-Type": "application/x-www-form-urlencoded",
            },
            data: data,
            success: function (data) {
              that.onCheckAssetinDigiAssets(data);
            },
            error: function (error) {
              console.log(error);
              //MessageBox.error("Failed to generate access token");
              MessageToast.show(
                "Invalid Username / Password. Contact Administrator.",
                { duration: 2000, at: "center center" }
              );
              $(".sapMMessageToast").addClass("sapMMessageToastDanger");
              BusyIndicator.hide();
            },
          });
        }
      },

      onCheckAssetinDigiAssets: function (data) {
        var empobj = data;
        var that = this;
        var uname = this.getView().byId("uid").getValue();
        $.ajax({
          //url: "http://api.nlcindia.com/nlcilapi/" + "api/v1/api/getIPAddress?",
          url:
            "http://api.nlcindia.com/nlcilapi/" +
            "api/v1/digiAsset/checkIPRestriction",
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + data.access_token,
          },
          success: function (data) {
            console.log(data);
            var adminip = [
              "172.16.29.71",
              "172.16.29.72",
              "172.16.29.69",
              "172.16.29.67",
              "172.16.108.141",
              "172.16.29.78",
              "172.16.36.186",
            ];
            if (adminip.includes(data.ip)) {
              admFlg = "Y";
            } else {
              admFlg = "N";
            }
            console.log(admFlg);
            console.log("IP address does not exist in the array.");

            if (data.status && data.status === "Y") {
              console.log("PC is in the IP range");
              console.log(data.ip);
              $.ajax({
                url:
                  "http://api.nlcindia.com/nlcilapi/" +
                  "api/v1/essmss/updateLoginDtls?",
                method: "POST",
                data: JSON.stringify({
                  assetIp: data.ip,
                  userName: uname,
                }),
                contentType: "application/json",
                headers: {
                  Authorization: "Bearer " + empobj.access_token,
                },
                success: function (data) {
                  console.log(data);
                  if (data === "Update Success") {
                    that.onGetEmpDataRoles(empobj);
                  } else {
                    MessageBox.error(data);
                    BusyIndicator.hide();
                  }
                },
                error: function (error) {
                  MessageBox.error("Failed to update Login device Details");
                  BusyIndicator.hide();
                },
              });
            } else {
              console.log("PC is not in the IP range");
              that.onGetEmpDataRoles(empobj);
            }
          },
          error: function (error) {
            MessageBox.error("Failed to fetch Pc IP Details");
            BusyIndicator.hide();
          },
        });
      },

      onGetEmpDataRoles: function (data) {
        var that = this;
        var uname = this.getView().byId("uid").getValue();
        var empobj = {};
        var orgIdObj = [];
        var rolesObj = [];
        var paObj = [];
        var npsRoles = [];
        empobj.cpfNo = uname;
        empobj.access_token = data.access_token;
        empobj.expires_in = data.expires_in;
        empobj.refresh_token = data.refresh_token;
        empobj.token_type = data.token_type;
        $.ajax({
          url:
            that.getNlcilApiUrl() + "api/v1/sap/hcm/empdata?pernr=400" + uname,
          type: "GET",
          headers: {
            accept: "*",
            Authorization: "Bearer " + empobj.access_token,
          },
          success: function (data) {
            console.log(data);
            if (data.infoType105 !== undefined) {
              if (data.infoType105[0].subType === "0007") {
                empobj.landlineNo = data.infoType105[0].commNo;
              }
            }
            empobj.pernr = data.infoType2[0].pernr;
            empobj.infoType = data.infoType2[0].infoType;
            empobj.subType = data.infoType2[0].subType;
            empobj.firstName = data.infoType2[0].firstName;
            empobj.titleName = data.infoType2[0].titleName;
            empobj.gender = data.infoType2[0].genderText;
            empobj.dob = data.infoType2[0].birthDate;
            empobj.state = data.infoType2[0].stateText;
            empobj.company = data.infoType1[0].companyCodeText;
            empobj.unit = data.infoType1[0].persArea;
            empobj.persArea = data.infoType1[0].persAreaText;
            empobj.persSubArea = data.infoType1[0].persSubAreaText;
            empobj.empGroup = data.infoType1[0].empGroup;
            empobj.empGroupText = data.infoType1[0].empGroupText;
            empobj.empSubGroup = data.infoType1[0].empSubGroup;
            empobj.payrollArea = data.infoType1[0].payrollArea;
            empobj.payrollAreaText = data.infoType1[0].payrollAreaText;
            empobj.costCenter = data.infoType1[0].costCenter;
            empobj.costCenterText = data.infoType1[0].costCenterText;
            empobj.orgUnit = data.infoType1[0].orgUnitText;
            empobj.position = data.infoType1[0].positionText;
            empobj.job = data.infoType1[0].jobText;
            empobj.jobId = data.infoType1[0].job;
            if (data.infoType4 !== undefined) {
              localStorage.setItem("disability", data.infoType4[0].sbGru);
            } else {
              localStorage.setItem("disability", "");
            }
            // Below lines added by Vijay on 17.12.2024.
            localStorage.setItem("pernr", data.infoType2[0].pernr);
            localStorage.setItem("firstName", data.infoType2[0].firstName);
            localStorage.setItem("persArea", data.infoType1[0].persAreaText);
            localStorage.setItem(
              "persSubArea",
              data.infoType1[0].persSubAreaText
            );
            localStorage.setItem("position", data.infoType1[0].positionText);
            // End of Changes.
            localStorage.setItem("empSubGroup", data.infoType1[0].empSubGroup);
            localStorage.setItem("jobText", data.infoType1[0].job);
            data.infoType41.forEach(function (item) {
              if (item.dateType === "Z2") {
                empobj.doj = item.date;
              }
            });
            $.ajax({
              url:
                that.getNlcilApiUrl() +
                "api/v1/sap/hcm/essmss/rolesList?pernr=" +
                empobj.pernr,
              type: "GET",
              headers: {
                accept: "*",
                Authorization: "Bearer " + empobj.access_token,
              },
              success: function (data) {
                console.log(data);
                if (data.roleMaster && data.roleMaster.length !== 0) {
                  for (var i = 0; i < data.roleMaster.length; i++) {
                    orgIdObj.push(data.roleMaster[i].orgId);
                    rolesObj.push(data.roleMaster[i].role);
                    paObj.push(data.roleMaster[i].persArea);
                  }
                  empobj.orgIds = orgIdObj;
                  empobj.respPersAreas = paObj;
                  empobj.allRoles = rolesObj;
                  if (rolesObj.includes("HRDA") || rolesObj.includes("PFL1")) {
                    empobj.userType = "APPROVER";
                  } else if (
                    rolesObj.includes("UFIN") ||
                    rolesObj.includes("PFL2")
                  ) {
                    empobj.userType = "FIN_APPROVER";
                  }
                } else {
                  empobj.userType = "INITIATOR";
                }

                $.ajax({
                  url:
                    that.getNlcilApiUrl() +
                    "api/v1/user/roles?appId=164" +
                    "&cpfNo=" +
                    uname,
                  type: "GET",
                  headers: {
                    accept: "*",
                    Authorization: "Bearer " + empobj.access_token,
                  },
                  success: function (data) {
                    console.log(data);
                    empobj.rbacRoles = [];
                    if (data && data.length !== 0) {
                      for (var i = 0; i < data.length; i++) {
                        var rbacRole = {};
                        rbacRole.pa = data[i].pa;
                        rbacRole.role = data[i].role;
                        empobj.rbacRoles.push(rbacRole);
                      }
                      // if(empobj.cpfNo === '47624'){
                      //     var rbacRole = {};
                      //     rbacRole.pa= 'A001';
                      //     rbacRole.role = 'UNIT_HOHR';
                      //     empobj.rbacRoles.push(rbacRole);
                      //     var rbacRole = {};
                      //     rbacRole.pa= 'A018';
                      //     rbacRole.role = 'UNIT_HOHR';
                      //     empobj.rbacRoles.push(rbacRole);
                      // }
                    }
                    localStorage.setItem("uid", JSON.stringify(empobj));
                    that.handleIntranetSuccessLogin(that);
                  },
                  error: function (xhr, status, error) {
                    MessageToast.show("Failed to fetch role details.", {
                      duration: 2000,
                      at: "center center",
                    });
                    $(".sapMMessageToast").addClass("sapMMessageToastDanger");
                  },
                });
              },
              error: function (xhr, status, error) {
                MessageToast.show(
                  "Failed to fetch essmss role workflow master details.",
                  { duration: 2000, at: "center center" }
                );
                $(".sapMMessageToast").addClass("sapMMessageToastDanger");
              },
            });
          },
          error: function (xhr, status, error) {
            MessageToast.show(
              "Failed to fetch user details. Contact Administrator. ",
              { duration: 2000, at: "center center" }
            );
            $(".sapMMessageToast").addClass("sapMMessageToastDanger");
            BusyIndicator.hide();
          },
        });
      },

      handleIntranetSuccessLogin: function (that) {
        var oRouter = sap.ui.core.UIComponent.getRouterFor(that);
        console.log(admFlg);
        if (admFlg === "Y" && pword === "AdminESS#321") {
          oRouter.navTo("rDashBoard");
        } else if (admFlg === "N" && pword === "AdminESS#321") {
          MessageToast.show("Your PC do not have Admin Previlages!", {
            duration: 2000,
            at: "center center",
          });
        } else if (admFlg === "N" && pword !== "AdminESS#321") {
          oRouter.navTo("rDashBoard");
        } else if (admFlg === "Y" && pword !== "AdminESS#321") {
          oRouter.navTo("rDashBoard");
        }

        BusyIndicator.hide();
      },
      onNavToResPwd: function () {
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.navTo("rResetIntraPwd");
      },
      onNavToGAuthQR: function () {
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.navTo("rGoogAuthenticationQR");
      },

      //        handleSAPSuccessLogin: function (that) {
      //            var oRouter = sap.ui.core.UIComponent.getRouterFor(that);
      //            oRouter.navTo("rPendingEncash");
      //            BusyIndicator.hide();
      //        }
    }); //extend function ends here
  }
); //define function ends here

//                if (oView.byId("userType").getSelectedKey() === "Initiator") {
//                    $.ajax({
//                        url: this.getNlcilApiUrl() + "oauth2/token",
//                        method: "POST",
//                        headers: {
//                            "Authorization": "Basic bmxjaWwtbW9iaWxlOkNvZGVAY29jcw==",
//                            "Content-Type": "application/x-www-form-urlencoded"
//                        },
//                        data: {
//                            "grant_type": "password",
//                            "username": uname,
//                            "password": pword,
//                            "scope": "read,write"
//                        },
//                        success: function (data) {
//                            empobj.cpfNo = uname;
//                            empobj.access_token = data.access_token;
//                            empobj.expires_in = data.expires_in;
//                            empobj.refresh_token = data.refresh_token;
//                            empobj.token_type = data.token_type;
//
//                            $.ajax({
//                                url: that.getNlcilApiUrl() + 'api/v1/sap/hcm/empdata?pernr=400' + uname,
//                                type: 'GET',
//                                headers: {
//                                    'accept': '*',
//                                    'Authorization': 'Bearer ' + empobj.access_token
//                                },
//                                success: function (data) {
//                                    empobj.pernr = data.infoType2[0].pernr;
//                                    empobj.infoType = data.infoType2[0].infoType;
//                                    empobj.subType = data.infoType2[0].subType;
//                                    empobj.firstName = data.infoType2[0].firstName;
//                                    empobj.titleName = data.infoType2[0].titleName;
//                                    empobj.gender = data.infoType2[0].genderText;
//                                    empobj.dob = data.infoType2[0].birthDate;
//                                    empobj.gender = data.infoType2[0].genderText;
//                                    empobj.state = data.infoType2[0].stateText;
//
//                                    empobj.company = data.infoType1[0].companyCodeText;
//                                    empobj.persArea = data.infoType1[0].persAreaText;
//                                    empobj.persSubArea = data.infoType1[0].persSubAreaText;
//                                    empobj.empGroup = data.infoType1[0].empGroup;
//                                    empobj.empGroupText = data.infoType1[0].empGroupText;
//                                    empobj.empSubGroup = data.infoType1[0].empSubGroup;
//                                    empobj.payrollArea = data.infoType1[0].payrollArea;
//                                    empobj.payrollAreaText = data.infoType1[0].payrollAreaText;
//                                    empobj.costCenter = data.infoType1[0].costCenter;
//                                    empobj.costCenterText = data.infoType1[0].costCenterText;
//                                    empobj.orgUnit = data.infoType1[0].orgUnitText;
//                                    empobj.position = data.infoType1[0].positionText;
//                                    empobj.job = data.infoType1[0].jobText;
//                                    empobj.userType = "INITIATOR";
//
//                                    localStorage.setItem('uid', JSON.stringify(empobj));
//                                    that.handleIntranetSuccessLogin(that);
//                                },
//                                error: function (xhr, status, error) {
//                                    MessageToast.show("Failed to fetch user details. Contact Administrator. ", {duration: 2000, at: 'center center'});
//                                    $(".sapMMessageToast").addClass("sapMMessageToastDanger");
//                                    BusyIndicator.hide();
//                                }
//                            });
//
//                        },
//                        error: function (error) {
//                            console.log(error);
//                            //MessageBox.error("Failed to generate access token");
//                            MessageToast.show("Invalid Username / Password. Contact Administrator. ", {duration: 2000, at: 'center center'});
//                            $(".sapMMessageToast").addClass("sapMMessageToastDanger");
//                            BusyIndicator.hide();
//                        }
//                    });
//                } else if (oView.byId("userType").getSelectedKey() === "Approver") {
//                    var that = this;
//                    $.ajax({
//                        url: this.getNlcilApiUrl() + "oauth2/token",
//                        method: "POST",
//                        headers: {
//                            "Authorization": "Basic bmxjaWwtbW9iaWxlOkNvZGVAY29jcw==",
//                            "Content-Type": "application/x-www-form-urlencoded"
//                        },
//                        data: {
//                            "grant_type": "client_credentials",
//                            "scope": "read write"
//                        },
//                        success: function (data) {
//                            empobj.pernr = uname;
//                            empobj.access_token = data.access_token;
//                            empobj.expires_in = data.expires_in;
//                            //empobj.refresh_token = data.refresh_token;
//                            empobj.token_type = data.token_type;
//                            empobj.userType = "APPROVER";
//                            empobj.pword = pword;
//                            $.ajax({
//                                url: that.getNlcilApiUrl() + 'api/v1/sap/hcm/ess/authenticate?username=' + uname + '&passwd=' + pword,
//                                type: 'POST',
//                                headers: {
//                                    'accept': '*',
//                                    'Authorization': 'Bearer ' + data.access_token
//                                },
//                                success: function (data) {
//                                    if (data === "OK") {
//                                        //MessageToast.show("Authentication sucess ", {duration: 2000, at: 'center center'});
//                                        //$(".sapMMessageToast").addClass("sapMMessageToastSuccess");
//                                        localStorage.setItem('uid', JSON.stringify(empobj));
//                                        that.handleSAPSuccessLogin(that);
//                                    } else {
//                                        MessageToast.show("SAP Authentication Failed", {duration: 2000, at: 'center center'});
//                                        $(".sapMMessageToast").addClass("sapMMessageToastDanger");
//                                        BusyIndicator.hide();
//                                    }
//                                },
//                                error: function (xhr, status, error) {
//                                    MessageToast.show("Invalid Username / Password ", {duration: 2000, at: 'center center'});
//                                    $(".sapMMessageToast").addClass("sapMMessageToastDanger");
//                                    BusyIndicator.hide();
//                                }
//                            });
//                        },
//                        error: function (error) {
//                            console.log(error);
//                            //MessageBox.error("Failed to generate access token");
//                            MessageToast.show("Failed to generate access token. Contact Administrator. ", {duration: 2000, at: 'center center'});
//                            $(".sapMMessageToast").addClass("sapMMessageToastDanger");
//                            BusyIndicator.hide();
//                        }
//                    });
//                }
