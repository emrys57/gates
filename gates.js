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
            $.extend(model, options); // just pile all the variables into this model
            if (model.input) { // then we want to create variables 
                self[options.variableName] = ko.observable(model.initialValue); // create a function at the root model level
                model.koValid = ko.computed(function() {
                    return model.valid(self[options.variableName]());
                });
                self[options.variableName + 'Valid'] = model.koValid;
            }
        };
        self.inParms.push(new ParmModel({variableName: 'oGate', initialValue: 3000, readable: 'O<sub>GATE</sub>', input: true, unit: 'mm', hint: 'Width, top hinge pin to outside of gate', valid: function(a) {var b = parseFloat(a); return (b>=1) && (b<=999999);}}));
        self.inParms.push(new ParmModel({variableName: 'oUD', initialValue: 900, readable: 'O<sub>UD</sub>', input: true, unit: 'mm', hint: 'Pitch between hinges', valid: function(a) {var b = parseFloat(a); return (b>=1) && (b<=999999);}}));
        self.inParms.push(new ParmModel({variableName: 'rise', initialValue: 150, readable: 'Rise', input: true, unit: 'mm', hint: 'Rise required at outside of gate when fully open', valid: function(a) {var b = parseFloat(a); return (b>=-self.oGate()) && (b<=self.oGate());}}));
        self.inParms.push(new ParmModel({variableName: 'beta', initialValue: 120, readable: 'β', input: true, unit: 'degrees', hint: 'Angle from closed gate to fully open gate', valid: function(a) {var b = parseFloat(a); return (b>=-360) && (b<=360);}}));


        function goneTooFar(effectiveRise, rise, delta) {
            if (delta > 0)
                return effectiveRise > rise;
            return effectiveRise < rise;
        }
        ;
        self.oNS = ko.computed(function() {
            var oUD = parseFloat(self.oUD());
            var oGate = parseFloat(self.oGate());
            var rise = parseFloat(self.rise());
            var deltaONS = (rise >= 0) ? 1 : -1;
            var oNS = -deltaONS;
            var errorNS = 999999;
            do {
                oNS += deltaONS;
                var effectiveRise = (oGate + oNS) * Math.sin(2 * Math.atan2(oNS, oUD));
                errorNS = effectiveRise - rise;
                if (goneTooFar(effectiveRise, rise, deltaONS))
                    deltaONS /= -10;
                console.log('ons:', effectiveRise, rise, deltaONS);
            } while (Math.abs(errorNS) > 0.000001);
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

        self.outParms.push(new ParmModel({variableName: 'oNS', unit: 'mm', readable: 'O<sub>NS</sub>', hint: 'Lower hinge offset in plane of gate'}));
        self.outParms.push(new ParmModel({variableName: 'oWE', unit: 'mm', readable: 'O<sub>WE</sub>', hint: 'Lower hinge outset perpendicular to gate'}));
        self.outParms.push(new ParmModel({variableName: 'theta', unit: 'degrees', readable: 'θ', hint: 'Angle of hinges in plane of gate'}));
        self.outParms.push(new ParmModel({variableName: 'φ', unit: 'degrees', readable: 'φ', hint: 'Angle of hinges perpendicular to gate'}));
      
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