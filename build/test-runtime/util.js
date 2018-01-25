"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
// import {assert} from 'chai';
var fs = require("fs");
var mkdirp_1 = require("mkdirp");
var vega_util_1 = require("vega-util");
exports.generate = process.env.VL_GENERATE_TESTS;
exports.output = 'test-runtime/resources';
exports.selectionTypes = ['single', 'multi', 'interval'];
exports.compositeTypes = ['repeat', 'facet'];
exports.resolutions = ['union', 'intersect'];
exports.bound = 'bound';
exports.unbound = 'unbound';
exports.tuples = [
    { a: 0, b: 28, c: 0 }, { a: 0, b: 55, c: 1 }, { a: 0, b: 23, c: 2 },
    { a: 1, b: 43, c: 0 }, { a: 1, b: 91, c: 1 }, { a: 1, b: 54, c: 2 },
    { a: 2, b: 81, c: 0 }, { a: 2, b: 53, c: 1 }, { a: 2, b: 76, c: 2 },
    { a: 3, b: 19, c: 0 }, { a: 3, b: 87, c: 1 }, { a: 3, b: 12, c: 2 },
    { a: 4, b: 52, c: 0 }, { a: 4, b: 48, c: 1 }, { a: 4, b: 35, c: 2 },
    { a: 5, b: 24, c: 0 }, { a: 5, b: 49, c: 1 }, { a: 5, b: 48, c: 2 },
    { a: 6, b: 87, c: 0 }, { a: 6, b: 66, c: 1 }, { a: 6, b: 23, c: 2 },
    { a: 7, b: 17, c: 0 }, { a: 7, b: 27, c: 1 }, { a: 7, b: 39, c: 2 },
    { a: 8, b: 68, c: 0 }, { a: 8, b: 16, c: 1 }, { a: 8, b: 67, c: 2 },
    { a: 9, b: 49, c: 0 }, { a: 9, b: 15, c: 1 }, { a: 9, b: 48, 'c': 2 }
];
var unitNames = {
    repeat: ['child_d', 'child_e', 'child_f'],
    facet: ['child_0', 'child_1', 'child_2']
};
exports.hits = {
    discrete: {
        qq: [8, 19],
        qq_clear: [5, 16],
        bins: [4, 29],
        bins_clear: [18, 7],
        repeat: [5, 10, 17],
        repeat_clear: [13, 14, 2],
        facet: [2, 6, 9],
        facet_clear: [3, 4, 8]
    },
    interval: {
        drag: [[5, 14], [18, 26]],
        drag_clear: [[5], [16]],
        translate: [[6, 16], [24, 8]],
        bins: [[4, 8], [2, 7]],
        bins_clear: [[5], [9]],
        bins_translate: [[5, 7], [1, 8]],
        repeat: [[8, 29], [11, 26], [7, 21]],
        repeat_clear: [[8], [11], [17]],
        facet: [[1, 9], [2, 8], [4, 10]],
        facet_clear: [[3], [5], [7]]
    }
};
function base(iter, sel, opts) {
    if (opts === void 0) { opts = {}; }
    var data = { values: opts.values || exports.tuples };
    var x = tslib_1.__assign({ field: 'a', type: 'quantitative' }, opts.x);
    var y = tslib_1.__assign({ field: 'b', type: 'quantitative' }, opts.y);
    var color = tslib_1.__assign({ field: 'c', type: 'nominal' }, opts.color);
    var size = tslib_1.__assign({ value: 100 }, opts.size);
    var selection = { sel: sel };
    var mark = 'circle';
    return iter % 2 === 0 ? {
        data: data, selection: selection, mark: mark,
        encoding: {
            x: x, y: y, size: size,
            color: {
                condition: tslib_1.__assign({ selection: 'sel' }, color),
                value: 'grey'
            }
        }
    } : {
        data: data,
        layer: [{
                selection: selection, mark: mark,
                encoding: {
                    x: x, y: y, size: size, color: color,
                    opacity: { value: 0.25 }
                }
            }, {
                transform: [{ filter: { selection: 'sel' } }],
                mark: mark,
                encoding: { x: x, y: y, size: size, color: color }
            }]
    };
}
function spec(compose, iter, sel, opts) {
    if (opts === void 0) { opts = {}; }
    var _a = base(iter, sel, opts), data = _a.data, spec = tslib_1.__rest(_a, ["data"]);
    var resolve = opts.resolve;
    switch (compose) {
        case 'unit':
            return tslib_1.__assign({ data: data }, spec);
        case 'facet':
            return {
                data: data,
                facet: { row: { field: 'c', type: 'nominal' } },
                spec: spec,
                resolve: resolve
            };
        case 'repeat':
            return {
                data: data,
                repeat: { row: ['d', 'e', 'f'] },
                spec: spec,
                resolve: resolve
            };
    }
    return null;
}
exports.spec = spec;
function unitNameRegex(specType, idx) {
    var name = unitNames[specType][idx].replace('child_', '');
    return new RegExp("child(.*?)_" + name);
}
exports.unitNameRegex = unitNameRegex;
function parentSelector(compositeType, index) {
    return compositeType === 'facet' ? "cell > g:nth-child(" + (index + 1) + ")" :
        unitNames.repeat[index] + '_group';
}
exports.parentSelector = parentSelector;
function brush(key, idx, parent, targetBrush) {
    var fn = key.match('_clear') ? 'clear' : 'brush';
    return "return " + fn + "(" + exports.hits.interval[key][idx].join(', ') + ", " + vega_util_1.stringValue(parent) + ", " + !!targetBrush + ")";
}
exports.brush = brush;
function pt(key, idx, parent) {
    var fn = key.match('_clear') ? 'clear' : 'pt';
    return "return " + fn + "(" + exports.hits.discrete[key][idx] + ", " + vega_util_1.stringValue(parent) + ")";
}
exports.pt = pt;
function embedFn(browser) {
    return function (spec) {
        browser.execute(function (_) { return window['embed'](_); }, spec);
    };
}
exports.embedFn = embedFn;
function svg(browser, path, filename) {
    var xml = browser.executeAsync(function (done) {
        window['view'].runAfter(function (view) { return view.toSVG().then(function (_) { return done(_); }); });
    });
    if (exports.generate) {
        mkdirp_1.sync(path = exports.output + "/" + path);
        fs.writeFileSync(path + "/" + filename + ".svg", xml.value);
    }
    return xml.value;
}
exports.svg = svg;
function testRenderFn(browser, path) {
    return function (filename) {
        // const render =
        svg(browser, path, filename);
        // const file = fs.readFileSync(`${output}/${path}/${filename}.svg`);
        // assert.equal(render, file);
    };
}
exports.testRenderFn = testRenderFn;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3Rlc3QtcnVudGltZS91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLCtCQUErQjtBQUMvQix1QkFBeUI7QUFDekIsaUNBQXNDO0FBQ3RDLHVDQUFzQztBQUl6QixRQUFBLFFBQVEsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDO0FBQ3pDLFFBQUEsTUFBTSxHQUFHLHdCQUF3QixDQUFDO0FBR2xDLFFBQUEsY0FBYyxHQUFvQixDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFDbEUsUUFBQSxjQUFjLEdBQWtCLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQ3BELFFBQUEsV0FBVyxHQUEwQixDQUFDLE9BQU8sRUFBRSxXQUFXLENBQUMsQ0FBQztBQUU1RCxRQUFBLEtBQUssR0FBRyxPQUFPLENBQUM7QUFDaEIsUUFBQSxPQUFPLEdBQUcsU0FBUyxDQUFDO0FBRXBCLFFBQUEsTUFBTSxHQUFHO0lBQ3BCLEVBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUMsRUFBRSxFQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFDLEVBQUUsRUFBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBQztJQUM3RCxFQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFDLEVBQUUsRUFBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBQyxFQUFFLEVBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUM7SUFDN0QsRUFBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBQyxFQUFFLEVBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUMsRUFBRSxFQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFDO0lBQzdELEVBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUMsRUFBRSxFQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFDLEVBQUUsRUFBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBQztJQUM3RCxFQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFDLEVBQUUsRUFBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBQyxFQUFFLEVBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUM7SUFDN0QsRUFBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBQyxFQUFFLEVBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUMsRUFBRSxFQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFDO0lBQzdELEVBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUMsRUFBRSxFQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFDLEVBQUUsRUFBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBQztJQUM3RCxFQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFDLEVBQUUsRUFBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBQyxFQUFFLEVBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUM7SUFDN0QsRUFBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBQyxFQUFFLEVBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUMsRUFBRSxFQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFDO0lBQzdELEVBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUMsRUFBRSxFQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFDLEVBQUUsRUFBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBQztDQUNoRSxDQUFDO0FBRUYsSUFBTSxTQUFTLEdBQUc7SUFDaEIsTUFBTSxFQUFFLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUM7SUFDekMsS0FB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