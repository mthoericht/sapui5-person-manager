export {};

declare const QUnit: {
  start: () => void;
};

sap.ui.define([
  "person/app/test/integration/journeys/PersonListJourney",
], function ()
{
  "use strict";

  QUnit.start();
});
