// ==UserScript==
// @name           Memrise Infinite Learning
// @namespace      https://github.com/cooljingle
// @description    Causes items to continually be loaded during a learning session
// @match          https://www.memrise.com/course/*/garden/*
// @match          https://www.memrise.com/garden/review/*
// @version        0.0.13
// @updateURL      https://github.com/cooljingle/memrise-infinite-learning/raw/master/Memrise_Infinite_Learning.user.js
// @downloadURL    https://github.com/cooljingle/memrise-infinite-learning/raw/master/Memrise_Infinite_Learning.user.js
// @grant          none
// ==/UserScript==

$(document).ready(function() {
    var g = MEMRISE.garden,
        forceEnd = false;

    g.boxes.load = (function() {
        var cached_function = g.boxes.load;
        return function() {
            enableInfiniteLearning();
            var result = cached_function.apply(this, arguments);
            enableHeaderOverride();
            return result;
        };
    }());

    function enableInfiniteLearning() {
        g.boxes.activate_box = (function() {
            var cached_function = g.boxes.activate_box;
            return function() {
                var self = this,
                    prevBox = this._list[this.num - 1],
                    box = (prevBox && prevBox.autoLearn) ? _.find(this._list.slice(this.num), l => l.learnable_id !== prevBox.learnable_id) : this._list[this.num];
                if(box.template === "end_of_session" && !forceEnd) {
                    fetchMore(() => cached_function.apply(self, arguments));
                } else {
                    cached_function.apply(self, arguments);
                }
            };
        }());

        function fetchMore(callback) {
            $.getJSON("https://www.memrise.com/ajax/session/", g.session_params)
                .done(function( response ) {
                var removed = _.remove(response.boxes, b => {
                    var thinguser = _.find(response.thingusers, t => t.learnable_id === b.learnable_id);
                    return thinguser && (new Date(thinguser.next_date) > new Date() || _.any(g.boxes._list, x => x.autoLearn && x.learnable_id === b.learnable_id));
                });
                if(response.session && response.session.slug !== "practise") {
                    if(removed.length){
                        setTimeout(() => fetchMore(callback), 500);
                        return;
                    } else {
                        //boxes
                        _.each(response.boxes, function(b){$.extend(b, {scheduled: true});});
                        Array.prototype.splice.apply(g.boxes._list, [g.boxes._list.length -1 , 0].concat(response.boxes));
                        //learnables
                        _.each(response.learnables, l => g.learnables[l.learnable_id] = l);
                        //screens
                        $.extend(MEMRISE.garden.screens, response.screens);
                        if(g.populateScreens)
                            g.populateScreens();
                        //things_to_courses
                        $.extend(g.things_to_courses, response.things_to_courses);
                        //thingusers
                        g.thingusers.load(response.thingusers);

                        $('#infinite-learning').text(Object.keys(g.learnables).length);
                    }
                }
                callback();
            })
                .fail(function( jqxhr, textStatus, error ) {
                var err = textStatus + ", " + error;
                console.log( "Request Failed: " + err );
                callback();
            });
        }
    }

    function enableHeaderOverride() {
        g.session.setHeaderContent = (function() {
            var cached_function = g.session.setHeaderContent;
            return function() {
                var result = cached_function.apply(this, arguments);
                $('.js-course-details').html(function(i,v){return  v.replace(/(\d+)/, "<span id='infinite-learning' data-toggle='tooltip' data-placement='left' title='Go to end of session screen'>$1</span>");});
                $('#infinite-learning')
                    .hover(function(){ $(this).css({'color': 'red', 'cursor':'pointer'}); }, function() { $(this).css('color', 'white'); } )
                    .click(function(){ forceEnd = true; MEMRISE.garden.boxes.num = MEMRISE.garden.boxes._list.length - 1; MEMRISE.garden.boxes.activate_box();});
                return result;
            };
        }());
    }
});
