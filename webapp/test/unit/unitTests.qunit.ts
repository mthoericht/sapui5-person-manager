export {};

declare const QUnit: {
  start: () => void;
};

sap.ui.define([
  "person/app/test/unit/controller/PersonList.controller.qunit",
  "person/app/test/unit/service/LanguageService.qunit",
  "person/app/test/unit/validation/personValidation.qunit",
  "person/app/test/unit/util/i18nUtil.qunit",
  "person/app/test/unit/util/modelStateUtil.qunit",
  "person/app/test/unit/util/personListQueryUtil.qunit",
], function ()
{
  "use strict";

  QUnit.start();
});
