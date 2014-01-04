// Age and Birthdate
// Hold old are you?
// "I'm four!"
// That means that the age could be anything from 4 years and 0ms to 5years minus 1ms.
// "She's 10 weeks now." That means 10 weeks and 0ms to 11 weeks less 1ms.
// "He's 3 weeks and 2 days" means 23 days and 0ms to 24 days less 1ms.
// if the days are specified, as well as months or years, it is possible to have an impossible birthdate.
// If someone is one month and 1 day old on march 31, when were they born?
// one month and one day before March 31 is Feb 30, which never exists. If they were born on Feb 28, they are 1 month and 3 days old.
// If they were born on March 1, they are 30 days old.
// They cannot be 1 month and 1 day old.
// If someone is 1 year 0 days old on feb 29 2004, they must have been born feb 29 2003, which is impossible.

var jQuery;
var $ = (function(my) {
    return my;
}(jQuery || {}));
var ko = (function(my) {
    return my;
}(ko || {}));





var M$ = (function(my) {
    my.radiansFromDegrees = function(d) {
        return d * Math.PI / 180;
    };
    my.degreesFromRadians = function(d) {
        return d * 180 / Math.PI;
    };
    my.viewModel = function() {
        var self = this;
        self.round2 = function(a) {
            return Math.round(a * 100) / 100;
        };
        self.developmentWanted = ko.computed(function() {
            var a = window.location.hostname;
            if (a == 'localhost')
                return true;
            return false;
        });
        self.showModel = ko.observable(false);
//        self.oGate = ko.observable('3000');
//        self.oUD = ko.observable('900');
        self.inParms = ko.observableArray();
        self.outParms = ko.observableArray();
        var ParmModel = function(options) {
            var model = this;
            model.initialValue = '';
            model.input = false;
            model.more = false;
            model.showMore = ko.observable(false);
            model.moreClicked = function() {
                model.showMore(!model.showMore());
            };
            $.extend(model, options); // just pile all the variables into this model
            if (model.input) { // then we want to create variables 
                self[options.variableName] = ko.observable(model.initialValue); // create a function at the root model level
                model.koValid = ko.computed(function() {
                    return model.valid(self[options.variableName]());
                });
                self[options.variableName + 'Valid'] = model.koValid;
            }
        };
        self.inParms.push(new ParmModel({variableName: 'oGate', initialValue: 3000, readable: 'O<sub>GATE</sub>', input: true, unit: 'mm',
            hint: 'Width, top hinge pin to outside of gate',
            more: '<img src="./gate8.png" style="width: 100%" />',
            valid: function(a) {
                var b = parseFloat(a);
                return (b >= 1) && (b <= 999999);
            }}));
        self.inParms.push(new ParmModel({variableName: 'oUD', initialValue: 900, readable: 'O<sub>UD</sub>', input: true, unit: 'mm', hint: 'Pitch between hinges',
            more: '<img src="./gate9.png" style="width: 40%" />', valid: function(a) {
                var b = parseFloat(a);
                return (b >= 1) && (b <= 999999);
            }}));
        self.inParms.push(new ParmModel({variableName: 'rise', initialValue: 150, readable: 'Rise', input: true, unit: 'mm', hint: 'Rise required at outside of gate when fully open', more: '<img src="./gate12.png" style="width: 100%" />', valid: function(a) {
                var b = parseFloat(a);
                return (b >= -self.oGate()) && (b <= self.oGate());
            }}));
        self.inParms.push(new ParmModel({variableName: 'beta', initialValue: 120, readable: 'β', input: true, unit: 'degrees', hint: 'Angle from closed gate to fully open gate', more: '<img src="./gate13.png" style="width: 100%" />', valid: function(a) {
                var b = parseFloat(a);
                return (b >= -360) && (b <= 360);
            }}));
        self.inParmsValid = ko.computed(function(){
            for (var i = 0; i < self.inParms().length; i++)
                if (!self.inParms()[i].koValid())
                    return false;
            return true;
        });


        function goneTooFar(effectiveRise, rise, delta) {
            if (delta > 0)
                return effectiveRise > rise;
            return effectiveRise < rise;
        }
        ;
        // this was the original numeric solver. It works but converges slowly.
//        self.oNS = ko.computed(function() {
//            var oUD = parseFloat(self.oUD());
//            var oGate = parseFloat(self.oGate());
//            var rise = parseFloat(self.rise());
//            var deltaONS = (rise >= 0) ? 1 : -1;
//            var oNS = -deltaONS;
//            var errorNS = 999999;
//            do {
//                oNS += deltaONS;
//                var effectiveRise = (oGate + oNS) * Math.sin(2 * Math.atan2(oNS, oUD));
//                errorNS = effectiveRise - rise;
//                if (goneTooFar(effectiveRise, rise, deltaONS))
//                    deltaONS /= -10;
//                console.log('ons:', effectiveRise, rise, deltaONS);
//            } while (Math.abs(errorNS) > 0.000001);
//            return oNS;
//        });
    // This is a faster-converging solver, because the earlier one was spiritually unsatisfying, although adequate.
    // Because the problem is very well-behaved, this seems likely always to converge.
    // It converges to 1 part in 1e12 within 5 loops!
        self.oNS = ko.computed(function(){
            var oUD = parseFloat(self.oUD());
            var oGate = parseFloat(self.oGate());
            var rise = parseFloat(self.rise());
            if (rise == 0) // or we get NaN in the loop below
                return 0;
            var dRiseByDONS = 1; // pure guess
            var oNS = 0;
            var effectiveRise = (oGate + oNS) * Math.sin(2 * Math.atan2(oNS, oUD));
            var previousEffectiveRise;
            var previousONS;
            var error = effectiveRise - rise;
            var dONS;
            do {
                previousONS = oNS;
                previousEffectiveRise = effectiveRise;
                dONS = - error / dRiseByDONS;
                oNS += dONS;
                effectiveRise = (oGate + oNS) * Math.sin(2 * Math.atan2(oNS, oUD));
                error = effectiveRise - rise;
                dRiseByDONS = (effectiveRise - previousEffectiveRise) / dONS;
                console.log('oNS2:', oNS, effectiveRise, dONS, error, dRiseByDONS);
            } while (Math.abs(error) > .0000001);
            return oNS;
        });
        self.oWE = ko.computed(function() {
            var beta = parseFloat(self.beta());
            var alpha = 90 - beta / 2;
            var alphaRadians = my.radiansFromDegrees(alpha);
            var result = self.oNS() * Math.tan(alphaRadians);
            return Math.round(result * 100) / 100;
        });
        // rotation of hinges in plane of gate
        self.theta = ko.computed(function() {
            return my.degreesFromRadians(Math.atan2(self.oNS(), self.oUD()));
        });
        self.φ = ko.computed(function() {
            return my.degreesFromRadians(Math.atan2(self.oWE(), self.oUD()));
        });

        self.outParms.push(new ParmModel({variableName: 'oNS', unit: 'mm', readable: 'O<sub>NS</sub>', hint: 'Lower hinge offset in plane of gate', more: '<img src="./gate10.png" style="width: 40%" />'}));
        self.outParms.push(new ParmModel({variableName: 'oWE', unit: 'mm', readable: 'O<sub>WE</sub>', hint: 'Lower hinge outset perpendicular to gate', more: '<img src="./gate11.png" style="width: 40%" />'}));
        self.outParms.push(new ParmModel({variableName: 'theta', unit: 'degrees', readable: 'θ', hint: 'Angle of hinges in plane of gate', more: '<img src="./gate14.png" style="width: 40%" /><div class="ib comment" style="vertical-align: top; padding: 1em; width: 55%;">The hinges should be rotated to this angle looking straight at the gate.<br />For loose-fitting hinges, often this does not matter.</div>'}));
        self.outParms.push(new ParmModel({variableName: 'φ', unit: 'degrees', readable: 'φ', hint: 'Angle of hinges perpendicular to gate', more: '<img src="./gate15.png" style="width: 40%" /><div class="ib comment" style="vertical-align: top; padding: 1em; width: 55%;">The hinges should be rotated to this angle looking along the gate.<br />For loose-fitting hinges, often this does not matter.</div>'}));

        self.sayings = ko.observableArray();
        // http://forum.canadianwoodworking.com/showthread.php?29910-Woodworking-Sayings
        self.sayings.push('Measure twice, cut once.',
            'Measure twice, cut once, use filler for the gaps.',
            'Measure twice, cut once, buy extra just in case.',
            'I can only make one person happy at a time.<br />Today is not your day.<br />Tomorrow isn\'t looking too good either.',
            'There are 4 ways to make a piece of lumber into a wood object.<ul><li>The right way</li><li>The wrong way</li><li>The expert\'s way</li><li>My way.</li></ul>',
            'The things I make may be for others, but how I make them is for me.',
            'A Craftsman is a woodworker who has learned how to hide his mistakes.',
            'I cut it again, and it\'s still too short!',
            'Congratulations, you\'ve just figured out the most complicated way to hold a board 3 feet off the ground.',
            'Caution! This machine has no brain. Use your own.',
            'Measure three times. Take the average. Then get someone else to cut it.',
            'An expert at anything was once a beginner.',
            'Don\'t worry .... the trim will hide it',
            'it\'s not a mistake, it\'s a design feature',
            'People love chopping wood. In this activity one immediately sees results.', // http://thinkexist.com/quotes/with/keyword/wood/
            'He who dies with the most tools wins.',
            'The life so short, the trade so long to learn...',
            'Anyone who thinks money doesn\'t grow on trees hasn\'t bought any wood lately.',
            'Woodworking; a wonderful way to turn fine timber into offcuts, kindling and sawdust.',
            'My tool is bigger than yours.',
            'By All means read what the experts have to say. Just don’t let it get in the way of your woodworking.', // http://www.popularwoodworking.com/woodworking-blogs/editors-blog/woodworking-quotations-quips-aphorisms-and-more
            'First, sharpen all your tools.',
            'The pioneers cleared the forests from Jamestown to the Mississippi with fewer tools than are stored in the modern garage.',
            'The carpenter is not the best who makes more chips than all the rest.',
            'The finest tool ever created is the human hand, but it is weak and it is fallible.',
            'Everything with a power cord eventually winds up in the trash.'
            );
        var oldSaying = '';
        self.counter = ko.observable(0);
        self.saying = ko.computed(function() {
            var j = self.counter();
            if (j == -1)
                return 'The strangest things can happen when you least expect them';
            // http://stackoverflow.com/questions/1527803/generating-random-numbers-in-javascript-in-a-specific-range
            // but that does generate the max number, despite what the answer says.
            function getRandomInt(min, max) {
                return Math.floor(Math.random() * (max - min + 1)) + min;
            }
            var saying;
            var max1 = self.sayings().length - 1;
            var n;
            do {
                n = getRandomInt(0, max1);
                saying = self.sayings()[n];
            } while (saying == oldSaying);
            oldSaying = saying;
//            console.log("saying: ", n, saying, max1);
            return saying;
        });
        self.sayingButtonPressed = function(){ self.counter(self.counter()+1);};
    };

    return my;
}(M$ || {}));

$(document).ready(function() {
    var effectDuration = 500;

    var viewModel = new M$.viewModel();
    ko.bindingHandlers.slideContent = {// This is used to slide the content when the choice is opened or closed
        init: function() {
//            console.log('slideContent: init');
        },
        update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var opened = ko.unwrap(valueAccessor());
//            console.log("update:", element, valueAccessor, allBindingsAccessor, viewModel, bindingContext, opened);
            if (opened) {
                $(element).filter(':not(.opened)').addClass('opened');
                $(element).find('> .content:not(:visible)').slideDown(effectDuration); // immediate children only
            } else {
                $(element).filter('.opened').removeClass('opened');
                $(element).find('> .content:visible').slideUp(effectDuration);
            }
        }
    };
    ko.bindingHandlers.slideContent2 = {
        init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
//            console.log("init:", element, valueAccessor, allBindingsAccessor, viewModel, bindingContext, ko.unwrap(valueAccessor()));
            var opened = ko.unwrap(valueAccessor());
        },
        update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
//            console.log("update:", element, valueAccessor, allBindingsAccessor, viewModel, bindingContext, ko.unwrap(valueAccessor()));
            var opened = ko.unwrap(valueAccessor());
            if (opened)
                $(element).slideDown(effectDuration);
            else
                $(element).slideUp(effectDuration);
        }
    };


    ko.applyBindings(viewModel);
    console.log('Hello!');
});