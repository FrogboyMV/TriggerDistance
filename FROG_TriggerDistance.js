//=============================================================================
// Frogboy RMMV Plugin
// FrogTriggerDistance.js
//=============================================================================

//=============================================================================
/*:
 * @plugindesc v1.1 Trigger Events at a distance based on Radius or X/Y Axis
 * @author Frogboy
 *
 * @help
 * TriggerDistance v1.1
 * Author Frogboy
 *
 * ============================================================================
 * Introduction
 * ============================================================================
 *
 * This plugin is mainly used to avoid duplicating the same Event multiple
 * times in order to cover more than one square.  By specifying your parameters
 * in comment of an Event page, the Player Touch Trigger can be fired when
 * your Player is at a specified distance from the Event and/or on a certain
 * axis.  I've also added functionality to list specific modes
 * of travel that will trigger an event.  Now you can fly your airship to a
 * floating island but not walk or sail into it from the ground.  Yay!
 *
 * ============================================================================
 * How to Use
 * ============================================================================
 *
 * On an Event page that has a Player Touch trigger, create a Comment and enter
 * it in this format: <TriggerDistance: parameters>
 * Parameters are separated by a space.
 *
 * The following parameters are supported.  Each one is immediately followed by
 * a number to specify the distance in squares/tiles that the Event sould fire.
 *    r#      - Radius (Any square within # of Event)
 *    x#      - X-Axis (Any square within # of Event on the X-Axis [left/right])
 *    y#      - Y-Axis (Any square within # of Event on the Y-Axis [up/down])
 *    s#      - Switch Binding (Will turn ON the specified Switch ID and not
 *              fire again while the Switch is on)
 *
 * These can also be specified in the parameters to indicate which modes of
 * travel this event will fire for.  If you specify none then an Event Touch
 * will always trigger.
 *    walk    - Tagged Event Touch will trigger if you are walking
 *    boat    - Tagged Event Touch will trigger if you are on your boat
 *    ship    - Tagged Event Touch will trigger if you are on your ship
 *    airship - Tagged Event Touch will trigger if you are on your airship
 *
 * Examples:
 *    X-Axis
 *    <TriggerDistance: x5>
 *        Will cover the Event square and 5 tiles to the left and right of it.
 *        Great for spanning a hallway.
 *        #####E#####
 *
 *    Y-Axis
 *    <TriggerDistance: y2>
 *        Will cover the Event square and 2 tiles above and below of it.
 *        #
 *        #
 *        E
 *        #
 *        #
 *
 *    Radius
 *    <TriggerDistance: r3>
 *        Will cover the Event square and 3 tiles in all directions.
 *           #
 *          ###
 *         #####
 *        ###E###
 *         #####
 *          ###
 *           #
 *
 *        <TriggerDistance: x999>
 *        Will cover the the entire edge of the top or bottom of a map.
 *        It doesn't have to be the top or bottom edge but that's what it is
 *        typically used for.  The number is set purposely large to cover any
 *        size map.
 *
 *        <TriggerDistance: y999>
 *        Will cover the the entire edge of the left or right of a map.
 *        It doesn't have to be the left or right edge but that's what it is
 *        typically used for.  The number is set purposely large to cover any
 *        size map.
 *
 *    Radius with Switch
 *    <TriggerDistance: r2 s12>
 *        Will cover the Event square and 2 tiles in all directions, will turn
 *        on Switch ID 12 and not fire an Event Toouch again while Switch 12 is
 *        ON.
 *           #
 *          ###
 *         ##E##
 *          ###
 *           #
 *
 *    Event Player Touch only fires when you are in your airship
 *    <TriggerDistance: airship>
 *        No radius, x or y specified so this only covers the event tile
 *           E
 *
 * ============================================================================
 * Switch Property
 * ============================================================================
 *
 * The Switch property isn't all that useful any longer.  It was a fix for
 * issues I had when this plugin used the Note Tag to specify parameters and
 * thus, didn't know which Event Page you were on.  By entering the parameters
 * into Comments that are specific to the page the Event is currently on, I
 * don't really have a good use case for this any longer.  I'm leaving it in
 * just in case you find one.
 *
 * ============================================================================
 * Terms of Use
 * ============================================================================
 *
 * This plugin can be used in commercial or non-commercial projects.
 * Credit Frogboy in your work
 *
 * ============================================================================
 * Changelog
 * ============================================================================
 *
 * Version 1.0 - Initial release
 * Version 1.1 - Parameters now use Comments instead of Note Tag.  Because I
 *     only ever gave this to one person, I broke backwards compatability.
*/
//=============================================================================

(function() {
	var aliasGameEventSetupPageSettings = Game_Event.prototype.setupPageSettings;
	Game_Event.prototype.setupPageSettings = function() {
		aliasGameEventSetupPageSettings.call(this);
		this._triggerDistance = "";
		var page = this.page();
		for (var i=0; i<page.list.length; i++) {
			if (page.list[i].code == 108) {
				var params = page.list[i].parameters[0];
				var triggerDistance = params.match(/<TriggerDistance:(.*)>/i);
				if (triggerDistance) {
					this._triggerDistance = triggerDistance[1];
					break;
				}
			}
		}
	};

	Game_Player.prototype.startMapEvent = function(x, y, triggers, normal) {
		if (!$gameMap.isEventRunning()) {
			$gameMap.eventsXy(x, y).forEach(function(event) {
				if (event.isTriggerIn(triggers)) {
					event.start();
				}
			});
		}
	};

	Game_Map.prototype.eventsXy = function(x, y) {
		var return_events = [];
		for (var i=0; i<this.events().length; i++) {
			var event = this.events()[i];
			if (event._triggerDistance && event._trigger === 1) {
				var tdx = -1;
				var tdy = -1;
				var tdr = -1;
				var tdSwitch = 0;
				var bOk = false;
				var walk = false;
				var boat = false;
				var ship = false;
				var airship = false;
				var vehicle = $gamePlayer._vehicleType;
				var arr = (event._triggerDistance.includes(" "))
							? event._triggerDistance.split(' ')
							: [event._triggerDistance];

				for (var j=0; j<arr.length; j++) {
					if (arr[j].trim() != "") {
						if (arr[j].toLowerCase().trim() == "walk") {
							walk = true;
						}
						else if (arr[j].toLowerCase().trim() == "boat") {
							boat = true;
						}
						else if (arr[j].toLowerCase().trim() == "ship") {
							ship = true;
						}
						else if (arr[j].toLowerCase().trim() == "airship") {
							airship = true;
						}
						else {
							switch (arr[j].charAt(0).toLowerCase())
							{
								case 'r':
									tdr = parseInt(arr[j].substr(1) || -1);
									bOk = true;
									break;
								case 'x':
									tdx = parseInt(arr[j].substr(1) || -1);
									bOk = true;
									break;
								case 'y':
									tdy = parseInt(arr[j].substr(1) || -1);
									bOk = true;
									break;
								case 's':
									tdSwitch = parseInt(arr[j].substr(1) || 0);
									break;
							}
						}
					}
				}

				// If none specified then all apply
				if (walk == false && boat == false && ship == false && airship == false) {
					walk = true;
					boat = true;
					ship = true;
					airship = true;
				}

				// If no Trigger Distance specified, assume Radius zero
				if (bOk == false) {
					tdr = 0;
				};

				// Make sure travel mode is valid
				if (((walk == true && vehicle == "walk") || (boat == true && vehicle == "boat") ||
					(ship == true && vehicle == "ship") || (airship == true && vehicle == "airship")) &&
					(tdSwitch < 0 || !$gameSwitches.value(tdSwitch)))
				{
					var distance = Math.abs(event.deltaXFrom(x)) + Math.abs(event.deltaYFrom(y));

					// Check Radius Trigger
					if (tdr > -1 && distance <= tdr) {
						if (tdSwitch > 0) {
							$gameSwitches.setValue(tdSwitch, true);
						}
						return_events.push(event);
					}

					// Check X-Axis Trigger
					if (tdx > -1 && distance <= tdx && y === event.y) {
						if (tdSwitch > 0) {
							$gameSwitches.setValue(tdSwitch, true);
						}
						return_events.push(event);
					}

					// Check Y-Axis Trigger
					if (tdy > -1 && distance <= tdy && x === event.x) {
						if (tdSwitch > 0) {
							$gameSwitches.setValue(tdSwitch, true);
						}
						return_events.push(event);
					}
				}
			}
			else if (event._x == x && event._y == y) {
				if (!$gamePlayer.isInAirship()) {
					return_events.push(event);
				}
			}
		}

		return return_events;
	};

	Game_Player.prototype.canStartLocalEvents = function() {
		return true;
	};
})();
