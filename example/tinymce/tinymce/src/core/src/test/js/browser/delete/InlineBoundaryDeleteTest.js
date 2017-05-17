asynctest(
  'browser.tinymce.core.delete.InlineBoundaryDeleteTest',
  [
    'ephox.agar.api.ApproxStructure',
    'ephox.agar.api.Assertions',
    'ephox.agar.api.GeneralSteps',
    'ephox.agar.api.Keys',
    'ephox.agar.api.Logger',
    'ephox.agar.api.Pipeline',
    'ephox.agar.api.Step',
    'ephox.katamari.api.Fun',
    'ephox.mcagar.api.TinyActions',
    'ephox.mcagar.api.TinyApis',
    'ephox.mcagar.api.TinyLoader',
    'ephox.sugar.api.node.Element',
    'tinymce.core.caret.CaretPosition',
    'tinymce.core.keyboard.BoundaryLocation',
    'tinymce.themes.modern.Theme'
  ],
  function (
    ApproxStructure, Assertions, GeneralSteps, Keys, Logger, Pipeline, Step, Fun, TinyActions, TinyApis, TinyLoader, Element, CaretPosition, BoundaryLocation,
    Theme
  ) {
    var success = arguments[arguments.length - 2];
    var failure = arguments[arguments.length - 1];

    Theme();

    var locationName = function (location) {
      return location.fold(
        Fun.constant('before'),
        Fun.constant('start'),
        Fun.constant('end'),
        Fun.constant('after')
      );
    };

    var readLocation = function (editor) {
      return BoundaryLocation
        .readLocation(editor.getBody(), CaretPosition.fromRangeStart(editor.selection.getRng()))
        .map(locationName)
        .getOr('none');
    };

    var sTestDeleteOrBackspaceKey = function (editor, tinyApis, tinyActions, key) {
      return function (setupHtml, setupPath, setupOffset, expectedHtml, expectedLocation, expectedPath, expectedOffet) {
        return GeneralSteps.sequence([
          tinyApis.sSetContent(setupHtml),
          tinyApis.sSetCursor(setupPath, setupOffset),
          tinyApis.sNodeChanged,
          tinyActions.sContentKeystroke(key, { }),
          tinyApis.sAssertContent(expectedHtml),
          Step.sync(function () {
            Assertions.assertEq('Should be expected location', expectedLocation, readLocation(editor));
          }),
          tinyApis.sAssertSelection(expectedPath, expectedOffet, expectedPath, expectedOffet),
          sNormalizeBody(editor)
        ]);
      };
    };

    var sNormalizeBody = function (editor) {
      return Step.sync(function () {
        editor.getBody().normalize();
      });
    };

    var paragraphWithText = function (text) {
      return ApproxStructure.build(function (s, str, arr) {
        return s.element('body', {
          children: [s.element('p', { children: [s.text(str.is(text))] })]
        });
      });
    };

    TinyLoader.setup(function (editor, onSuccess, onFailure) {
      var tinyApis = TinyApis(editor);
      var tinyActions = TinyActions(editor);
      var sTestBackspace = sTestDeleteOrBackspaceKey(editor, tinyApis, tinyActions, Keys.backspace());
      var sTestDelete = sTestDeleteOrBackspaceKey(editor, tinyApis, tinyActions, 46);

      Pipeline.async({}, [
        tinyApis.sFocus,
        Logger.t('Backspace key', GeneralSteps.sequence([
          sTestBackspace('<p>a<a href="#">b</a>c</p>', [0, 2], 0, '<p>a<a href="#">b</a>c</p>', 'end', [0, 1, 0], 1),
          sTestBackspace('<p>a<a href="#">b</a>c</p>', [0, 1, 0], 0, '<p>a<a href="#">b</a>c</p>', 'before', [0, 0], 1),
          sTestBackspace('<p>a<a href="#">bc</a>d</p>', [0, 1, 0], 1, '<p>a<a href="#">c</a>d</p>', 'start', [0, 1, 0], 1)
        ])),
        Logger.t('Delete key', GeneralSteps.sequence([
          sTestDelete('<p>a<a href="#">b</a>c</p>', [0, 0], 1, '<p>a<a href="#">b</a>c</p>', 'start', [0, 1, 0], 1),
          sTestDelete('<p>a<a href="#">b</a>c</p>', [0, 1, 0], 1, '<p>a<a href="#">b</a>c</p>', 'after', [0, 2], 1),
          sTestDelete('<p>a<a href="#">bc</a>d</p>', [0, 1, 0], 1, '<p>a<a href="#">b</a>d</p>', 'end', [0, 1, 0], 1)
        ])),
        Logger.t('Backspace/delete last character', GeneralSteps.sequence([
          sTestDelete('<p>a<a href="#">b</a>c</p>', [0, 1, 0], 0, '<p>ac</p>', 'none', [0, 0], 1),
          sTestDelete('<p><img src="#1" /><a href="#">b</a><img src="#2" /></p>', [0, 1, 0], 0, '<p><img src="#1" /><img src="#2" /></p>', 'none', [0], 1),
          sTestDelete('<p>a<a href="#">b</a>c</p>', [0, 1, 0], 0, '<p>ac</p>', 'none', [0, 0], 1),
          tinyApis.sAssertContentStructure(paragraphWithText('ac')),
          sTestBackspace('<p>a<a href="#">b</a>c</p>', [0, 1, 0], 1, '<p>ac</p>', 'none', [0, 0], 1),
          tinyApis.sAssertContentStructure(paragraphWithText('ac'))
        ]))
      ], onSuccess, onFailure);
    }, {
      skin_url: '/project/src/skins/lightgray/dist/lightgray'
    }, success, failure);
  }
);