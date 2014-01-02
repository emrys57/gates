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


// https://github.com/zeroclipboard/ZeroClipboard/blob/master/docs/instructions.md
function setUpZero(viewModel) {

    function $findValue(button) { // find the $value field from the associated button
        var a = $(button).parent().find('.drValue');
//        console.log('findValue: ', button, a);
        return a;
    }

    ZeroClipboard.setDefaults({
        moviePath: './ZeroClipboard.swf',
        hoverClass: 'smallButtonHover',
        activeClass: 'smallButtonActive'
    });
    var clip = new ZeroClipboard($('.copyButton'));
//    clip.on('complete', function(client, args) {
//        console.log("Copied text to clipboard: " + args.text);
//    });
    clip.on('mouseover', function(client, args) {
        var $value = $findValue(this);
        $findValue(this).addClass('clipHover');
    });

    clip.on('mouseout', function(client) {
        $findValue(this).removeClass('clipHover');
    });

    clip.on('mousedown', function(client) {
        var $value = $findValue(this);
        $value.addClass('clipActive clipPing');
        window.setTimeout(function() {
            $value.removeClass('clipPing');
        }, 300); // do it here rather than on complete because that doesn't happen until mouseup
    });

    clip.on('mouseup', function(client) {
        $findValue(this).removeClass('clipActive');
    });

    clip.on('noflash', function() {
        viewModel.copyPossible(false);
//        viewModel.errorFlash('Sorry! You need Adobe Flash to make the <copy> feature work. You can just select the text and copy it by hand.');
    });
    clip.on('wrongflash', function() {
        viewModel.copyPossible(false);
//        viewModel.errorFlash('Sorry! You need a more recent Adobe Flash to make the <copy> feature work. You can just select the text and copy it by hand.');
    });
}


var M$ = (function(my) {

    function monthNames(upperCase) {
        var m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        if (upperCase)
            return m;
        return m.toLowerCase();
    }

    my.tooEarly = function(when) {
        // Julian dates are too early because the New Year was at March 25 in Britain!
        var jMinDate = new Date(Date.UTC(1752, 9 - 1, 14));
        return when.getTime() < jMinDate.getTime();
    };

    my.isJulian = function(when) {
        // This needs adjusting for the Julian-to-Gregorian switch
        // Javascript Date gets the day of the week wrong in Julian dates
        // although other things seem fine
        var jToGDate = new Date(Date.UTC(1752, 9 - 1, 3)); // nonexistant date! 
        return when.getTime() < jToGDate.getTime();
    };

    my.dayFromDate = function(when, chars) {
        // This needs adjusting for the Julian-to-Gregorian switch
        // Javascript Date gets the day of the week wrong in Julian dates
        // although other things seem fine
        // NO THIS DOES NOT WORK
        // Because javascript gets the leap year wrong in 1700
        if (typeof chars == 'undefined')
            chars = 3;
        var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        var d = when.getDay();
        if (my.isJulian(when)) {// julian date
//        console.log('dayFromDate: Adjusting Julian day', when.toUTCString());
            d = (d + 4) % 7; // adjust day of week
        }
        return days[d].substr(0, chars);
    };

    my.viewModel = function() {
        var self = this;
        var onDateText = '1999';
        function isLeapYear(y) {
            if ((y % 4) !== 0)
                return false;
            if (y === 2000)
                return true;
            if ((y % 100) === 0)
                return false;
            return true;
        }
        self.showModel = ko.observable(false);
        self.ageYears = ko.observable();
        self.ageMonths = ko.observable();
        self.ageWeeks = ko.observable();
        self.ageDays = ko.observable();
        self.ageY = ko.observable();
        self.ageYValid = ko.observable();
        self.ageYSet = ko.computed(function() {
            var trimmed2 = ('' + self.ageYears()).trim();
            var trimmed = trimmed2.replace(/[^0-9]/g, '');
            if ((trimmed === '') || (trimmed !== trimmed2)) {
                self.ageY(0);
                self.ageYValid(true);
                return false;
            } else {
                var y = Math.floor(trimmed);
                if (y > 130) {
                    self.ageY(y);
                    self.ageYValid(false);
                    return false;
                } else {
                    self.ageY(y);
                    self.ageYValid(true);
                    return true;
                }
            }
        });
        self.calculation = ko.observable(); // just define it here or get a problem with forward references
        self.briUnit = ko.observable(); // this will hold a pointer to the object, not the codedValue. ditto.
        self.ageYMin = ko.computed(function() {
            if ((self.calculation() != 'bfaaukc') || (self.ukCensusYear() != '1841')) // not 1841 census
                return self.ageY();
            if ((self.ageY() < 15) || ((self.ageY() % 5) != 0)) // child, or gave right age anyway
                return self.ageY();
            // ages were rounded down to the nearest 5 years. So any age from 15..19 would state 15.
            // so after all this...
            return self.ageY(); // the min age in years was the stated value anyway.
        });
        self.ageYMax = ko.computed(function() {
            if ((self.calculation() != 'bfaaukc') || (self.ukCensusYear() != '1841'))
                return self.ageY();
            // All 15-year-olds gave their correct age. However, many gave 15 who were older. So the comparison is "< 15".
            if ((self.ageY() < 15) || ((self.ageY() % 5) != 0)) // child, or gave right age anyway
                return self.ageY();
            // ages were rounded down to the nearest 5 years. So any age from 15..19 would state 15.
            return self.ageY() + 4; // Just adding 4 to 15 gets 19. Etc.
        });
        self.ageM = ko.observable();
        self.ageMValid = ko.observable();
        self.ageMSet = ko.computed(function() {
            var trimmed2 = ('' + self.ageMonths()).trim();
            var trimmed = trimmed2.replace(/[^0-9]/g, '');
            if ((trimmed === '') || (trimmed !== trimmed2)) {
                self.ageM(0);
                self.ageMValid(true);
                return false;
            } else {
                var y = Math.floor(trimmed);
                if (self.ageY() === 0) {
                    if (y > 60) {
                        self.ageM(0);
                        self.ageMValid(false);
                        return false;
                    }
                } else {
                    if (y > 11) {
                        self.ageM(0);
                        self.ageMValid(false);
                        return false;
                    }
                }
                self.ageM(y);
                self.ageMValid(true);
                return true;
            }
        });
        self.ageW = ko.observable();
        self.ageWValid = ko.observable();
        self.ageWSet = ko.computed(function() {
            var trimmed2 = ('' + self.ageWeeks()).trim();
            var trimmed = trimmed2.replace(/[^0-9]/g, '');
            if ((trimmed === '') || (trimmed !== trimmed2)) {
                self.ageW(0);
                self.ageWValid(true);
                return false;
            } else {
                var y = Math.floor(trimmed);
                if (self.ageM() !== 0)
                    if (y > 4) {
                        self.ageW(0);
                        self.ageWValid(false);
                        return false;
                    }
                if (self.ageY() !== 0)
                    if (y > 51) {
                        self.ageW(0);
                        self.ageWValid(false);
                        return false;
                    }
                if (y > 156) {
                    self.ageW(0);
                    self.ageWValid(false);
                    return false;
                }
                self.ageW(y);
                self.ageMValid(true);
                return true;
            }
        });
        self.ageD = ko.observable();
        self.ageDValid = ko.observable();
        self.ageDSet = ko.computed(function() {
            var trimmed2 = ('' + self.ageDays()).trim();
            var trimmed = trimmed2.replace(/[^0-9]/g, '');
            if ((trimmed === '') || (trimmed !== trimmed2)) {
                self.ageD(0);
                self.ageDValid(true);
                return false;
            } else {
                var y = Math.floor(trimmed);
                if ((self.ageW() !== 0) && (y > 6)) {
                    self.ageD(0);
                    self.ageDValid(false);
                    return false;
                }
                if ((self.ageM() !== 0) && (y > 31)) {
                    self.ageD(0);
                    self.ageDValid(false);
                    return false;
                }
                if (self.ageD() > 366) {
                    self.ageD(0);
                    self.ageDValid(false);
                    return false;
                }
                self.ageD(y);
                self.ageDValid(true);
                return true;
            }
        });
        // We need separate min and max day ages for the birth registration compuation.
        // Births may be registered up to 6 weeks after the event.
        // So the youngest the child might be is 0 days, and the oldest is 42 days.
        self.ageDMin = ko.computed(function() {
            if (self.calculation() != 'bfbrq')
                return self.ageD();
            return 0;
        });
        self.ageDMax = ko.computed(function() {
            if (self.calculation() != 'bfbrq')
                return self.ageD();
            return 42; // :-)
        });
        self.ageMMin = ko.computed(function() {
            return self.ageM();
        });
        self.ageMMax = ko.computed(function() {
            return self.ageM();
        });
        self.ageWMin = ko.computed(function() {
            return self.ageW();
        });
        self.ageWMax = ko.computed(function() {
            return self.ageW();
        });

        self.ageValid = ko.computed(function() {
            return self.ageYValid() && self.ageMValid() && self.ageWValid() && self.ageDValid();
        });
        self.ageSet = ko.computed(function() {
            return self.ageValid() && (self.ageYSet() || self.ageMSet() || self.ageWSet() || self.ageDSet());
        });


        self.onDate1Year = ko.observable('');
        self.onDate1Month = ko.observable('');
        self.onDate1Day = ko.observable('');

        self.onDate1YMin = ko.observable();
        self.onDate1YMax = ko.observable();


        self.onDate1MMin = ko.observable();
        self.onDate1MMax = ko.observable();
        self.onDate1MValid = ko.observable(true);

        self.onDate1YSet = ko.computed(function() {
            var trimmed2 = ('' + self.onDate1Year()).trim();
            var trimmed = trimmed2.replace(/[^0-9]/g, '');
            if ((trimmed === '') || (trimmed !== trimmed2)) {
                self.onDate1YMin(1753);
                self.onDate1YMax(2100);
                return false;
            } else {
                var y = Math.floor(trimmed);
                console.log('year2: ' + y);
                if ((y > 2100) || (y < 1753)) {
                    self.onDate1YMin(1753);
                    self.onDate1YMax(2100);
                    return false;
                } else {
                    self.onDate1YMin(y);
                    self.onDate1YMax(y);
                    console.log('year: ' + y);
                    return true;
                }
            }
        });
        self.onDate1YValid = ko.computed(function() {
            return self.onDate1YSet();
        });
        self.onDate1YSetReadout = ko.computed(function() {
            return self.onDate1YSet() ? 'Set!' : 'Unset.';
        });
        self.onDate1MSet = ko.computed(function() {
            var trimmed2 = ('' + self.onDate1Month()).trim();
            if (trimmed2 === '') {
                self.onDate1MValid(true);
                self.onDate1MMin(1);
                self.onDate1MMax(12);
                return false;
            }
            var trimmed3 = trimmed2.toLowerCase();
            var trimmed4 = trimmed3.replace(/[^0-9a-z]/g, '');
            if (trimmed3 !== trimmed4) { // there is some weird character
                self.onDate1MValid(false);
                self.onDate1MMin(1);
                self.onDate1MMax(12);
                return false;
            }
            var c = trimmed4.charAt(0);
            if (c >= 'a') { // it's a string
                var month = trimmed4;//.substr(0,3);
                var months = monthNames(false); // lower case months
                for (var i = 0; i < months.length; i++)
                    if (month === months[i]) {
                        var md = (i % 12) + 1;
                        self.onDate1MValid(true);
                        self.onDate1MMin(i + 1);
                        self.onDate1MMax(i + 1);
                        return true;
                    }
                self.onDate1MValid(false);
                self.onDate1MMin(1);
                self.onDate1MMax(12);
                return false;
            }
            var md = Math.floor(trimmed4);
            if ((md === 0) || (md > 12)) {
                self.onDate1MValid(false);
                self.onDate1MMin(1);
                self.onDate1MMax(12);
                return false;
            }
            self.onDate1MValid(true);
            self.onDate1MMin(md);
            self.onDate1MMax(md);
            return true;
        });
        self.onDate1DMin = ko.observable();
        self.onDate1DMax = ko.observable();
        self.onDate1DValid = ko.observable(true);
        self.onDate1DSet = ko.computed(function() {
            var daysInMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            if (self.onDate1YSet() && isLeapYear(self.onDate1YMax()))
                daysInMonth[2] = 29;
            var trimmed2 = ('' + self.onDate1Day()).trim();
            var trimmed3 = trimmed2.replace(/[^0-9]/g, '');
            if (trimmed2 !== trimmed3) {
                self.onDate1DValid(false);
                console.log('D1');
                self.onDate1Dmin = 1;
                self.onDate1Dmax(self.onDate1MSet() ? daysInMonth[self.onDate1MMax()] : 31); // valid for Dec
                return false;
            }
            if (trimmed3 === '') {
                self.onDate1DValid(true);
                console.log('D3');
                self.onDate1DMin(1);
                self.onDate1DMax(self.onDate1MSet() ? daysInMonth[self.onDate1MMax()] : 31); // valid for Dec 
                return false;
            }
            var dd = Math.floor(trimmed3);

            if ((dd === 0) || (!self.onDate1MSet()) || (dd > daysInMonth[self.onDate1MMin()])) {
                self.onDate1DValid(false);
                console.log('D2');
                self.onDate1DMin(1);
                self.onDate1DMax(self.onDate1MSet() ? daysInMonth[self.onDate1MMax()] : 31); // valid for Dec 
                return false;
            }
            self.onDate1DValid(true);
            console.log('D4');
            self.onDate1DMin(dd);
            self.onDate1DMax(dd);
            return true;
        });

        self.onDate1Min = ko.observable(new Date());
        self.onDate1Max = ko.observable(new Date());
        self.setDate1 = ko.computed(function() {
            // done like this so can set onDate1Min in other ways too
            if (self.calculation() == 'bfaaukc') { // set date min and max to be day of census
                var i = self.ukCensusYears.indexOf(self.ukCensusYear());
                if (i < 0)
                    return;
                var dString = self.ukCensusDate()[i];
                var parm = dString.split('-');
                if (parm.length < 3)
                    return;
                var d = new Date(Date.UTC(parm[0], parm[1] - 1, parm[2]));
                self.onDate1Min(d);
                self.onDate1Max(d);
            } else if (self.calculation() == 'bfbrq') { // set date to be start and end of birth reigstration interval
                if (self.onDate1YSet() && self.briUnit()) { // have to check briUnit, can be undefined.
                    var y = self.onDate1YMin();
                    var a = new Date(Date.UTC(y, self.briUnit().minM, 1)); // first day of first month of quarter (or month)
                    var b = new Date(Date.UTC(y, self.briUnit().maxM + 1, 1, 23, 59, 59, 999)); // first day of first month of next quarter (or month)
                    var c = new Date(b.setUTCDate(0)); // the last day of the last month of the quarter (or month)
                    self.onDate1Min(a);
                    self.onDate1Max(c);
                    console.log('setDate1', c.toUTCString());
                }
            } else { // set date min and max according to set fields of onDate
                var a = new Date(Date.UTC(self.onDate1YMin(), self.onDate1MMin() - 1, self.onDate1DMin()));
                var b = new Date(Date.UTC(self.onDate1YMax(), self.onDate1MMax() - 1, self.onDate1DMax(), 23, 59, 59, 999));
                self.onDate1Min(a);
                self.onDate1Max(b);
            }
//            console.log('setDate: min:', self.onDate1YMin(), self.onDate1MMin() - 1, self.onDate1DMin(), a.toUTCString());
//            console.log('setDate: max:', self.onDate1YMax(), self.onDate1MMax() - 1, self.onDate1DMax(), b.toUTCString());
        });
        self.onDate1DayMin = ko.computed(function() {
            return my.dayFromDate(self.onDate1Min());
        });
        self.onDate1DayMax = ko.computed(function() {
            return my.dayFromDate(self.onDate1Max());
        });
        self.onDate1Valid = ko.computed(function() {
            return self.onDate1YValid();
        });

        self.onEarliestDate = ko.computed({
            read: function() {
                return self.onDate1Valid() ? self.onDate1Min().toString() : 'Invalid';
            }
        });
        self.onLatestDate = ko.computed({
            read: function() {
                return self.onDate1Valid() ? self.onDate1Max().toString() : 'Invalid';
            }
        });
        function setVars(d) { // put some simple variables Math.flooro a date object so we can change them easily without date trying to second-guess us
            d.y = d.getUTCFullYear();
            d.m = d.getUTCMonth();
            d.w = 0; // there isn't a week function :-)
            d.d = d.getUTCDate();
        }
        // compute an object that gives the calendar distance in time between early date ed and later date ld.
        // The result is given in terms of {y, m, w, d}
        // but the unts can be specified by units {y, m, w, d}
        // the options being {d} {w d}, {m w d} {y m w d} {y d} {y w d} {m d} {y m d} - actually, anything as long as it includes d!
        // calendarDistance between 2003-2-28 and 2004-3-29 is {1, 1, 0, 1}
        function calendarDistance(ed, ld, units2) {
            var units = {y: ko.unwrap(units2.y), m: ko.unwrap(units2.m), w: ko.unwrap(units2.w), d: ko.unwrap(units2.d)};
            ed.setUTCHours(0, 0, 0, 0); // make sure ed is at midnight of this day, whatever the time in the date is, UTC
            ld.setUTCHours(0, 0, 0, 0); // make sure ld is at midnight, ditto
            ld.setUTCHours(5); // move ld forward to 1am to avoid any issue with leap seconds
            setVars(ed);
            setVars(ld);
            var dy = 0;
            var dm = 0;
            var dw = 0;
            var dd = 0;

            var ad = null;
            var bd = null;
            var cd = null;
            var fd = null;
            var gd = null;

            if (units.y) { // want year readout
                dy = ld.y - ed.y;
                ed.y = ld.y; // so the date represented by ed.{ymwd) may not be real now
            }
            if (units.m) { // want month readout
                if (units.y) {
                    dm = ld.m - ed.m;
                    if (dm < 0) { // say, ed is 2003/11 and ld is 2004/3
                        dm += 12;
                        dy--;
                    }
                } else { // no units.y, need 18 months
                    dm = ld.m - ed.m + (ld.y - ed.y) * 12;
                }
            }
            if (units.d) {
                if (units.m) {
                    dd = ld.d - ed.d;
                    if (dd < 0) { // say, ld is 2004-3-13 and ed is 2004-2-22
                        // Done like this because we naturally work back from later date, then move forward a month, then count back in days.
                        ad = new Date(ed);
                        ad.setUTCDate(1); // ad is 00:00 on the day the month started
                        bd = new Date(ad);
                        bd = new Date(bd.setUTCMonth(bd.getUTCMonth() + 1)); // 00:00 on the day the next month starts
                        bd = new Date(bd.setUTCHours(5)); // 1am to avoid any leap second issue
                        var daysInMonth = Math.floor((bd.getTime() - ad.getTime()) / 86400000);
                        dd += daysInMonth;
                        dm--;
                        if (dm < 0) {
                            dm += 12;
                            dy--;
                        }
                    } else {
                    }
                } else if (units.y) {
                    cd = new Date(Date.UTC(ed.getUTCFullYear(), ld.getUTCMonth(), ld.getUTCDate(), 5, 0, 0)); // adjusts date if needed, 2003-2-29 becomes 2003-3-1

                    dd = Math.floor((cd.getTime() - ed.getTime()) / 86400000);
                    // the above computation applies if ed is 2003-2-28 and ld is 2004-2-29.
                    // the adjusted date ad is 2003-3-1
                    // and subtracting ed from that gives dd=1, which is correct.

                    // if ed is 2003-2-28 and ld is 2004-3-1, we also get dd=1, which is also correct!

                    // But, if ed=2003-3-1 and ld=2004-2-29, we get dy = 1, dd=0, which is wrong.
                    // That's why there is a specific check for that one condition in this next clause.
                    // And here also, I have to adjust dd to account for the extra day that isn't otherwise counted.
                    if ((dd < 0) || ((dd == 0) && ((ld.getUTCMonth() == 1) && (ld.getUTCDate() == 29) && (cd.getUTCDate() != 29)))) {
                        dy--;
                        fd = new Date(Date.UTC(ed.getUTCFullYear() + 1, ld.getUTCMonth(), ld.getUTCDate(), 0, 5, 0, 0)); // adjusts date if needed, 2003-2-29 becomes 2003-3-1

                        dd = Math.floor((fd.getTime() - ed.getTime()) / 86400000);
                        if ((ld.getUTCMonth() == 1) && (ld.getUTCDate() == 29) && (fd.getUTCDate() != 29))
                            dd--;

                    }
                } else {
                    dd = Math.floor((ld.getTime() - ed.getTime()) / 86400000);
                }

            }
            if (units.w) { // just convert the day difference to weeks and days
                dw = Math.floor(dd / 7);
                dd = dd - dw * 7;
            }

            var result = {y: dy, m: dm, w: dw, d: dd};
            var units1 = '' + (units.y ? 'y' : '-') + (units.m ? 'm' : '-') + (units.w ? 'w' : '-') + (units.d ? 'd' : '-');
            var result1 = '' + result.y + '-' + result.m + '-' + result.w + '-' + result.d;
//            console.log('calendarDistance:', result1, ed.toUTCString(), ld.toUTCString(), units1, ad, bd, cd, fd, gd);
            return result;
        }

        function isPositiveInteger(s) {
            if (s == '')
                return false;
            var t = s.replace(/[0-9]/g, ''); // delete all digits
            if (t != '')
                return false;
            return true;
        }
        function EUnits(name) {
            var model = this;
            model.name = name;
            model.y = ko.observable(false);
            model.m = ko.observable(false);
            model.w = ko.observable(false);
            model.d = ko.observable(true);
        }
        function EDiff(name, ed, ld, units) {
            var model = this;
            model.name = name;
            model.d = ko.computed(function() {
                var a = calendarDistance(ed.date2(), ld.date2(), units);
//                console.log("EDiff1: ", units.y(), units.m(), units.w(), units.d());
//                console.log("EDiff2: ", a.y, a.m, a.w, a.d);
                return a;
            });
        }
        function EDate(name) {
            var model = this;
            model.name = name;
            model.y = ko.observable('');
            model.m = ko.observable('');
            model.d = ko.observable('');
            model.date2 = ko.observable(new Date());
            model.problems = ko.observable();
            model.valid = ko.computed(function() {
                model.problems('');
                if (!isPositiveInteger(model.y()) || !isPositiveInteger(model.m()) || !isPositiveInteger(model.d())) {
                    model.problems('integer');
                    return false;
                }
                // julian works now
//                if (model.y() <= 1752) { // Julian calendar, cannot cope!
//                    model.problems('julian');
//                    return false;
//                }
                if ((model.m() < 1) || (model.m() > 12)) {
                    model.problems('month');
                    return false;
                }
                if ((model.d() < 1) || (model.d() > 31)) {
                    model.problems('day');
                    return false;
                }
                var ay = model.y();
                var am = model.m() - 1;
                var adate = model.d();
                var adu = Date.UTC(ay, am, adate, 0, 0, 0, 0);
                var ad = new Date(adu); // is that UTC?
//                console.log("EDate2:", ay, am, adate, adu, ad, ad.getUTCMonth(), ad.toUTCString());
                model.date2(ad);
//                console.log("EDate3:", ad.toUTCString());
                if (ad.getUTCFullYear() != model.y()) {
                    model.problems('y ' + ad.toUTCString());
                    return false;
                }
                if (ad.getUTCMonth() != (model.m() - 1)) {
                    model.problems('m ' + ad.toUTCString());//+ ' ad.getUTCMonth:'+ad.getUTCMonth()+' (model.m() - 1):'+(model.m() - 1));
                    return false;
                }
                if (ad.getUTCDate() != model.d()) {
                    model.problems('d ' + ad.toUTCString());
                    return false;
                }
                return true;
            });
        }
        self.units = new EUnits('Units');
        self.dates = ko.observableArray();
        self.dates.push(new EDate('earlier'));
        self.dates.push(new EDate('later'));
        self.diff = new EDiff('Difference', self.dates()[0], self.dates()[1], self.units);

        // quickly set up which date fields are defined
        self.set2 = ko.computed(function() { // don't call this isSet()! reserved?
            var s;
            if (self.calculation() == 'bfbrq')
                s = {y: false, m: false, w: false, d: true};
            else
                s = {y: self.ageYSet(), m: self.ageMSet(), w: self.ageWSet(), d: self.ageDSet()};
//            console.log('set2:', s, self.calculation());
            return s;
        });
        self.earliestBirthdateImpossible = ko.observable(false);
        // Earliest birthdate has to be computed with ageYMax, which might be greater than ageYMin for the 1841 census.
        self.earliestBirthdate = ko.computed({
            read: function() {
                // This has proved exceptionally confusing and tricky.
                // Every straightforward approach so far has failed.
                // I have to make a fair guess at the date, then grope my way towards it a day at a time.
                var d = new Date(self.onDate1Min());
                var set = self.set2(); // which date fields are set?
//                console.log('sebd:', 'min:' + self.onDate1Min().toUTCString(), set);
                if (set.d)
                    d = new Date(d.setDate(d.getDate() - self.ageDMax() - 1));
                offset = (set.d) ? 0 : 1;
                if (set.w)
                    d = new Date(d.setDate(d.getDate() - (self.ageWMax() + offset) * 7));
                offset = (set.w || set.d) ? 0 : 1;
                if (set.m)
                    d = new Date(d.setMonth(d.getMonth() - self.ageMMax() - offset));
                var offset = (set.m || set.w || set.d) ? 0 : 1;
                if (set.y)
                    d = new Date(d.setFullYear(d.getFullYear() - self.ageYMax() - offset));
                if (self.ageSet())
                    d = new Date(d.setDate(d.getDate() + 1));

                var units = {y: set.y, m: set.m, w: set.w, d: true}; // can only ever have d true
                d = new Date(d.setDate(d.getDate() + 10)); // definitely forward of the actual date.
                if (d.getTime() > self.onDate1Min().getTime()) // have birth later than earliest, cannot happen!
                    d = new Date(self.onDate1Min());
                // compare diff with required age
                var earliestAcceptableDate = null;
                var e = new Date(d);
                if (!set.y && !set.m && !set.w && !set.d)
                    return e;
                for (; ; ) {
                    var diff = calendarDistance(d, self.onDate1Min(), units); // distance in required units, with mandatory days
//                    console.log('diff:', (set.y ? diff.y : ' ') + ',' + (set.m ? diff.m : ' ') + ',' + (set.w ? diff.w : ' ') + ',' + diff.d, self.onDate1Min().toUTCString());
                    var moveBack = false;
                    var overshot = false;
                    if ((set.y) && (diff.y < self.ageYMax())) { // years difference is too small, move birthdate backwards
                        moveBack = true;
                    } else if ((set.y) && (diff.y > self.ageYMax())) { // years difference is too large, we have overshot
                        overshot = true;
                    } else  // years, either way, are acceptable
                    if ((set.m) && (diff.m < self.ageMMax())) { // month difference is too small, move birthdate backwards
                        moveBack = true;
                    } else if ((set.m) && (diff.m > self.ageMMax())) { // month difference is too large
                        overshot = true;
                    } else if ((set.w) && (diff.w < self.ageWMax())) { // week difference is too small, move birthdate backwards
                        moveBack = true;
                    } else if ((set.w) && (diff.w > self.ageWMax())) { // week difference is too large
                        overshot = true;
                    } else if ((set.d) && (diff.d < self.ageDMax())) { // day difference is too small, move birthdate backwards
                        moveBack = true;
                    } else if ((set.d) && (diff.d > self.ageDMax())) { // day difference is too large
                        overshot = true;
                    }
                    if (!moveBack && !overshot) {
                        earliestAcceptableDate = new Date(d);
//                        console.log('acceptable:', d.toUTCString(), 'min1:' + self.onDate1Min().toUTCString());
                    }
                    if (overshot) {
//                        console.log('overshot:', d.toUTCString(), 'min2:' + self.onDate1Min().toUTCString());
                        break;
                    }
                    d = new Date(d.setDate(d.getDate() - 1));
//                    console.log('moving back to ', d.toUTCString(), 'min3:' + self.onDate1Min().toUTCString());
                }
                self.earliestBirthdateImpossible(!earliestAcceptableDate);
                if (self.earliestBirthdateImpossible())
                    return e;
//                console.log('earliestAcceptableDate', earliestAcceptableDate.toUTCString());
                return earliestAcceptableDate;
            }
        });

        // For latest birthdate, try same approach as earliest
        // compute a date somewhere in the region.
        // Move back 10 days to be sure we're beofre the latest date
        // Move forward one day at a time and pick the latest acceptable date
        self.latestBirthdateImpossible = ko.observable(false);

        // latest birthdate has to be computed with ageYMin. This is at the moment always the same as ageY. But, maybe not later.
        self.latestBirthdate = ko.computed({
            read: function() {
                // do it this way round so that we know whether the day-of-month exists in the month
                // that we're trying to set, when we set the month.
                var d = new Date(self.onDate1Max());
                var set = self.set2(); // which date fields are set?
                if (set.d)
                    d = new Date(d.setUTCDate(d.getUTCDate() - self.ageDMin()));
                if (set.w)
                    d = new Date(d.setUTCDate(d.getUTCDate() - self.ageWMin() * 7));
                if (set.y) // have to do this before month is set or leap year fails
                    d = new Date(d.setUTCFullYear(d.getUTCFullYear() - self.ageYMin()));
                if (set.m) {
                    d = new Date(d.setUTCMonth(d.getUTCMonth() - self.ageMMin()));
                }
                // d is now an approximation to the latest birthdate.
                d = new Date(d.setUTCDate(d.getUTCDate() - 10)); // move back 10 days so we are before latest birthdate
                var units = {y: set.y, m: set.m, w: set.w, d: true};

                var latestAcceptableDate = null;
                if (!set.y && !set.m && !set.w && !set.d)
                    return new Date(self.onDate1Max());

                for (; ; ) {
                    var diff = calendarDistance(d, self.onDate1Max(), units); // distance in required units, with mandatory days
//                    console.log('diff:', (set.y ? diff.y : ' ') + ',' + (set.m ? diff.m : ' ') + ',' + (set.w ? diff.w : ' ') + ',' + diff.d, self.onDate1Max().toUTCString());
                    var moveForward = false;
                    var overshot = false;

                    if ((set.y) && (diff.y > self.ageYMin())) { // years difference is too large, move birthdate forwards
                        moveForward = true;
                    } else if ((set.y) && (diff.y < self.ageYMin())) { // years difference is too small, we have overshot
                        overshot = true;
                    } else  // years, either way, are acceptable
                    if ((set.m) && (diff.m > self.ageMMin())) { // month difference is too large, move birthdate forwards
                        moveForward = true;
                    } else if ((set.m) && (diff.m < self.ageMMin())) { // month difference is too small
                        overshot = true;
                    } else if ((set.w) && (diff.w > self.ageWMin())) { // week difference is too large, move birthdate forwards
                        moveForward = true;
                    } else if ((set.w) && (diff.w < self.ageWMin())) { // week difference is too small
                        overshot = true;
                    } else if ((set.d) && (diff.d > self.ageDMin())) { // day difference is too large, move birthdate forwards
                        moveForward = true;
                    } else if ((set.d) && (diff.d < self.ageDMin())) { // day difference is too small
                        overshot = true;
                    }

                    if (!moveForward && !overshot) {
                        latestAcceptableDate = new Date(d);
//                        console.log('acceptable:', d.toUTCString(), 'max1:' + self.onDate1Max().toUTCString());
                    }
                    if (overshot) {
//                        console.log('overshot:', d.toUTCString(), 'max2:' + self.onDate1Max().toUTCString());
                        break;
                    }
                    d = new Date(d.setUTCDate(d.getUTCDate() + 1));
//                    console.log('moving forward to ', d.toUTCString(), 'max3:' + self.onDate1Max().toUTCString());
                }

                self.latestBirthdateImpossible(!latestAcceptableDate);
                if (self.latestBirthdateImpossible())
                    return new Date(self.onDate1Max());
//                console.log('latestAcceptableDate', latestAcceptableDate.toUTCString());
                return latestAcceptableDate;
            }
        });
        self.birthdateInvalid = ko.computed(function() {
            return false;
            return !self.onDate1Valid() || (self.latestBirthdate().getTime() < self.earliestBirthdate().getTime());
        });
        self.earliestBirthdateString = ko.computed({
            read: function() {
                return self.earliestBirthdate();
            }
        });
        self.latestBirthdateString = ko.computed({
            read: function() {
                return self.latestBirthdate().toString();
            }
        });
        // constructor function for the different calculations
        function Calculator(dropDownText, codedValue) {
            this.dropDownText = dropDownText;
            this.codedValue = codedValue;
        }
        self.calculators = ko.observableArray([]);
        self.calculators.push(new Calculator('Birthdate from Age on Any Date', 'bfaod'));
        self.calculators.push(new Calculator('Birthdate from Age on UK Census Day', 'bfaaukc'));
        self.calculators.push(new Calculator('Birthdate from birth registration quarter', 'bfbrq'));

        self.ukCensusYears = [1841, 1851, 1861, 1871, 1881, 1891, 1901, 1911, 1921, 1931, 1941, 1951, 1961, 1971, 1981, 1991, 2001, 2011];
        self.ukCensusYear = ko.observable('');
        self.ukCensusDate = ko.observableArray(['1841-6-6', '1851-3-30', '1861-4-7', '1871-4-2', '1881-4-3', '1891-4-5', '1901-3-31', '1911-4-2', '1921-6-19', '1931-4-26', 'No census', '1951-4-8', '1961-4-23', '1971-4-25', '1981-4-5', '1991-4-21', '2001-4-29', '2011-3-27']);
        self.displayedUKCensusDate = ko.computed(function() {
            var i = self.ukCensusYears.indexOf(self.ukCensusYear());
            if (i < 0)
                return '';
            var dString = self.ukCensusDate()[i];
            console.log('ducd:', i, dString);
            if (self.calculation() == 'bfaaukc') {
                // only resets date if we actually want the census calculation
                var parm = dString.split('-');
                if (parm.length < 3)
                    return dString;
                var d = new Date(Date.UTC(parm[0], parm[1] - 1, parm[2]));
                // self.onDate1Min and Max are set elsewhere now
                return d.toUTCString().replace(/ ..:.*/, ''); // remove time from string
            }

            return dString;
        });
        self.briUnits = ko.observableArray([]);
        function BRIUnit(dropDownText, codedValue, minM, maxM) {
            this.dropDownText = dropDownText;
            this.codedValue = codedValue;
            this.minM = minM;
            this.maxM = maxM;
        }
        self.registrationMonthly = ko.computed(function() {
            self.briUnits.push(new BRIUnit('Q1 Jan, Feb, Mar', 'q1', 0, 2));
            self.briUnits.push(new BRIUnit('Q2 Apr, May, Jun', 'q2', 3, 5));
            self.briUnits.push(new BRIUnit('Q3 Jul, Aug, Sep', 'q3', 6, 8));
            self.briUnits.push(new BRIUnit('Q4 Oct, Nov, Dec', 'q4', 9, 11));
            return false;
        }); // cannot find this info. Assume all quarterly.
        self.birthdateWanted = ko.computed(function() {
            return true;
        });
        self.birthdateImpossible = ko.computed(function() {
            return self.earliestBirthdateImpossible() || self.latestBirthdateImpossible();
        });
        self.onDate1Set = ko.computed(function() {
            return self.onDate1YSet() || self.onDate1MSet() || self.onDate1DSet();
        });
        self.displayDefined = ko.computed(function() {
            if (self.calculation() == 'bfaod') {
                if (!self.ageSet())
                    return false;
                if (!self.ageValid())
                    return false;
                if (!self.onDate1Set())
                    return false;
                if (!self.onDate1Valid())
                    return false;
                if (self.birthdateImpossible())
                    return false;
                if (self.earliestBirthdateTooEarly())
                    return false;
            }
            if (self.calculation() == 'bfaaukc') {
                if (!self.ageSet())
                    return false;
                if (!self.ageValid())
                    return false;
                if (self.birthdateImpossible())
                    return false;
                if (self.earliestBirthdateTooEarly())
                    return false;
            }
            if (self.calculation() == 'bfbrq') {
                if (!self.onDate1YSet())
                    return false;
                if (self.earliestBirthdateTooEarly())
                    return false;
            }
            return true;
        });
        self.earliestBirthdateTooEarly = ko.computed(function() {
            return M$.tooEarly(self.earliestBirthdate());
        });
        self.copyPossible = ko.observable(true);
        self.isFirefox = ko.observable(/mozilla/.test(navigator.userAgent.toLowerCase()) && !/webkit/.test(navigator.userAgent.toLowerCase()));
        self.onDate1ShowJulian = ko.computed(function() {
            return self.onDate1Valid() && M$.isJulian(self.onDate1Min());
        });
        self.earliestBirthdateJulian = ko.computed(function() {
            return self.displayDefined() && M$.isJulian(self.earliestBirthdate());
        });
        self.latestBirthdateJulian = ko.computed(function() {
            return self.displayDefined() && M$.isJulian(self.latestBirthdate());
        });
        self.developmentWanted = ko.computed(function() {
            var a = window.location.hostname;
            if (a == 'localhost')
                return true;
            return false;
        });
        self.saveButtonPressed = function() {
            var options = {};
            var savedThings = ['calculation', 'ageYears', 'ageMonths', 'ageWeeks', 'ageDays', 'onDate1Year', 'onDate1Month', 'onDate1Day', 'ukCensusYear', 'briUnit', 'bTextStored', 'dateTextStored'];
            for (var i = 0; i < savedThings.length; i++) { // all are assumed to be ko functions
                var a = self[savedThings[i]]();
                if ((typeof a == 'undefined') || ((a !== '0') && (a == 0)) || (a == '')) // do not save it
                    continue;
//                console.log('saveButtonPressed: Will save', savedThings[i], typeof a, a);
                options[savedThings[i]] = self[savedThings[i]](); // fetch ko.observable
            }
            var jsonSavedOptions = JSON.stringify(options);
            var encodedJsonSavedOptions = encodeURIComponent(jsonSavedOptions);
            window.history.pushState({}, "", window.location.pathname + "?options=" + encodedJsonSavedOptions);
            $('#saveButtonConfirm').slideDown();
        };
        self.customBirthdates = ko.observable(true);
        self.settingsOpen = ko.observable(false);
        self.settingsButtonPressed = function() {
            self.settingsOpen(!self.settingsOpen());
        };

        // http://stackoverflow.com/questions/8339857/how-to-know-if-selected-text-is-inside-a-specific-div/8340432#8340432
        // http://stackoverflow.com/questions/6690752/insert-html-at-caret-in-a-contenteditable-div
        function isOrContains(node, container) {
            while (node) {
                if (node === container) {
                    return true;
                }
                node = node.parentNode;
            }
            return false;
        }
        function elementContainsSelection(el) {
            var sel;
            if (window.getSelection) {
                sel = window.getSelection();
                if (sel.rangeCount > 0) {
                    for (var i = 0; i < sel.rangeCount; ++i) {
                        if (!isOrContains(sel.getRangeAt(i).commonAncestorContainer, el)) {
                            return false;
                        }
                    }
                    return true;
                }
            } else {
                sel = document.selection;
                if ((sel) && sel.type != "Control") {
                    return isOrContains(sel.createRange().parentElement(), el);
                }
            }
            return false;
        }
        function pasteHtmlAtCaret(html, selectPastedContent, element) {
            var sel, range;
            if (window.getSelection) {
                if (!elementContainsSelection(element))
                    return;
                // IE9 and non-IE
                sel = window.getSelection();
                if (sel.getRangeAt && sel.rangeCount) {
                    range = sel.getRangeAt(0);
                    range.deleteContents();

                    // Range.createContextualFragment() would be useful here but is
                    // only relatively recently standardized and is not supported in
                    // some browsers (IE9, for one)
                    var el = document.createElement("div");
                    el.innerHTML = html;
                    var frag = document.createDocumentFragment(), node, lastNode;
                    node = el.firstChild;
                    while (node) {
                        lastNode = frag.appendChild(node);
                        node = el.firstChild;
                    }
                    var firstNode = frag.firstChild;
                    range.insertNode(frag);

                    // Preserve the selection
                    if (lastNode) {
                        range = range.cloneRange();
                        range.setStartAfter(lastNode);
                        if (selectPastedContent) {
                            range.setStartBefore(firstNode);
                        } else {
                            range.collapse(true);
                        }
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                }
            }
        }

        function fdfv(d, s2) {
            function inp(u) {
                var t = '<input class="smallButtonDead" type="submit" value="' + u + '">';
                return t;
            }
            var ddd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

            var mmm = monthNames(true); // upper case months
            s = s2;
            var a;
            do {
                s2 = s;
                s = s.replace(inp('yyyy'), d.getUTCFullYear());
                a = ('00'+(d.getUTCMonth() + 1)).substr(-2); // make sure mm is 2 digits
                s = s.replace(inp('mm'), a);
                s = s.replace(inp('mmm'), mmm[d.getUTCMonth()]);
                s = s.replace(inp('mmmm'), mmm[d.getUTCMonth() + 12]);
                a = ('00'+(d.getUTCDate())).substr(-2); // make sure dd is 2 digits
                s = s.replace(inp('dd'), a); 
                s = s.replace(inp('ddd'), ddd[d.getUTCDay()]);
                s = s.replace(inp('day'), ddd[d.getUTCDay() + 7]);
            } while (s != s2);
            return s;
        }
//        var klugeSpace = '&#xfeff;';
    var klugeSpace = '&nbsp;';
        self.defaultDateText = ko.computed(function(){ return '<input class="smallButtonDead" type="submit" value="yyyy">-<input class="smallButtonDead" type="submit" value="mm">-<input class="smallButtonDead" type="submit" value="dd">' + (self.isFirefox()?klugeSpace: '');});
        self.defaultBText = ko.computed(function(){return 'Between <input class="smallButtonDead" type="submit" value="Earliest Birthdate"> and <input class="smallButtonDead" type="submit" value="Latest Birthdate">' + (self.isFirefox()?klugeSpace: '');});
        // dateTextStored is the version of dateText which is stored in the URL.
        // Done like this so that the default format son't take up any space in the URL

        self.dateText = ko.observable(self.defaultDateText());
        self.dateTextStored = ko.computed({
            read: function() {
                if (self.dateText() == '') // if dateText is blank, return a space, so it will be stored in URL
                    return ' ';
                if (self.dateText() == self.defaultDateText()) // if dateText is the default, return empty, so it won't be stored in the URL.
                    return '';
                return self.dateText();
            },
            write: function(v) {
                self.dateText(v);
            }
        });

        self.formattedEarliestDate = ko.computed(function() {
            return fdfv(self.earliestBirthdate(), self.dateText());
        });

        self.formattedLatestDate = ko.computed(function() {
            return fdfv(self.latestBirthdate(), self.dateText());
        });
        self.bText = ko.observable(self.defaultBText());
        self.bTextStored = ko.computed({
            read: function() {
                if (self.bText() == '')
                    return ' ';
                if (self.bText() == self.defaultBText())
                    return '';
                return self.bText();
            },
            write: function(v) {
                self.bText(v);
            }
        });
        self.insertPressed = function(s) {
            $('#customBirthdateDefinition').focus(); // set up selection? If never touched?
            var t;
            if (s == 'earliest')
                t = '<input class="smallButtonDead" type="submit" value="Earliest Birthdate"/>';
            else
                t = '<input class="smallButtonDead" type="submit" value="Latest Birthdate"/>';
            pasteHtmlAtCaret(t, false, $('#customBirthdateDefinition').get(0));
            $('#customBirthdateDefinition').trigger('change'); // because it doesn't otherwise!
            $('#customBirthdateDefinition').focus(); // because we lose focus by clicking the button
        };
        self.insertDatePressed = function(s) {
            $('#customDateDefinition').focus(); // set up selection? If never touched?
            var t;
            t = '<input class="smallButtonDead" type="submit" value="' + s + '"/>';
            pasteHtmlAtCaret(t, false, $('#customDateDefinition').get(0));
            $('#customDateDefinition').trigger('change'); // because it doesn't otherwise!
            $('#customDateDefinition').focus(); // because we lose focus by clicking the button
        };
        self.customBirthdateReadout = ko.computed(function() {
            if (!self.customBirthdates())
                return '';
            if (!self.displayDefined())
                return '';
            var r = self.bText();
            r = r.replace(/<input>/, 'INPUT');
            r = r.replace(/<input[^>]*value="Earliest Birthdate"[^>]*>/g, self.formattedEarliestDate());
            r = r.replace(/<input[^>]*value="Latest Birthdate"[^>]*>/g, self.formattedLatestDate());
            r = r.replace(/&nbsp;/g, ' ');
            return r;
        });

        self.restore = function(jsonThingsToRestore) {
            var thingsToRestore = JSON.parse(jsonThingsToRestore);
            if (!thingsToRestore)
                return;
            for (var thing in thingsToRestore)
                if (thingsToRestore.hasOwnProperty(thing))
                    if (typeof self[thing] == 'function')
                        self[thing](thingsToRestore[thing]); // set ko.observable to saved value
                    else
                        self[thing] = thingsToRestore[thing];
        };
    };

    my.getParameterByName = function(name) {
        var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
        return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
    };

    my.checkRestore = function(viewModel) { // can only do this after having instantiated the filters
        var jsonSavedOptions = my.getParameterByName('options');
        console.log('options: ', jsonSavedOptions);
        if (jsonSavedOptions) { // that's an object, not a string, an is null if it wasn't defined
            viewModel.restore(jsonSavedOptions);
        }
    };

    return my;
}(M$ || {}));

$(document).ready(function() {
//    http://stackoverflow.com/questions/1391278/contenteditable-change-events/6263537#6263537
    $('body').on('focus', '[contenteditable]', function() {
        var $this = $(this);
        $this.data('before', $this.html());
        return $this;
    }).on('blur keyup paste input', '[contenteditable]', function() {
        var $this = $(this);
        if ($this.data('before') !== $this.html()) {
            $this.data('before', $this.html());
            $this.trigger('change');
        }
        return $this;
    });
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

    //http://stackoverflow.com/questions/10296625/contenteditable-binding-for-knockoutjs
    // rpniemeyer's suggestion http://jsfiddle.net/rniemeyer/JksKx/
    var alreadyInUpdate = false;
    ko.bindingHandlers.htmlValue = {
        init: function(element, valueAccessor, allBindingsAccessor) {
            ko.utils.registerEventHandler(element, "change", function() {
                var elementValue = $(element).html();
                var modelValue = valueAccessor();
                if (ko.isWriteableObservable(modelValue)) {
                    alreadyInUpdate = true;
                    modelValue(elementValue);
                    alreadyInUpdate = false;
                }
                else { //handle non-observable one-way binding
                    var allBindings = allBindingsAccessor();
                    if (allBindings['_ko_property_writers'] && allBindings['_ko_property_writers'].htmlValue)
                        allBindings['_ko_property_writers'].htmlValue(elementValue);
                }
            });
        },
        update: function(element, valueAccessor) {
            var value = ko.utils.unwrapObservable(valueAccessor()) || "";
            if (alreadyInUpdate) {
                return;
            }
            element.innerHTML = value;
        }
    };

    ko.applyBindings(viewModel);
    console.log('Hello!');
    M$.checkRestore(viewModel);
    window.setTimeout(function() {
        setUpZero(viewModel); // Does not work unless I delay it. This is for the copy-to-clipboard function.
    }, 1000);
});