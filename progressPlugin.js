/**
 * Plugin to show progress bar whenever stores attached to a form are being loaded
 *
 * This helps give the users some visual feedback on possible progress or form loading
 *
 * @class   Ext.ux.plugin.ContainerStoreProgress
 * @extends Ext.util.Observable
 * @author  Yinka Kunle
 * @created 12-May-2015
 */

Ext = Ext || {};
Ext.ns("Ext.ux.plugin");

// Create an instance with config first
Ext.ux.plugin.ContainerStoreProgressObject = function(config) {

    // Set the default values if none is set in config
    Ext.applyIf(config, {
        title            : 'Please wait',
        message          : 'Loading items...',
        progressText     : 'Initializing...',
        completenessText : 'completed',
        width            : 300,
        progress         : true,
        closable         : false,
        animEl           : 'elId'
    });

    Ext.apply(this, config);
    Ext.ux.plugin.ContainerStoreProgress.superclass.constructor.call(this);
};

Ext.ux.plugin.ContainerStoreProgress = Ext.extend(
    Ext.ux.plugin.ContainerStoreProgressObject,
    Ext.util.Observable, {
    // private
    init: function(cmp){

        // Store states
        this.STATE_DONE      = 'done';
        this.STATE_LOADING   = 'loading';

        this.cmp = cmp; // Make a copy of form
        this.cmp.on('afterlayout', this.onAfterLayout, this);


        this.addEvents(
            /**
             * @event afterloadfake
             * Fires whenever any attached store emits 'beforeload' event
             * @param {Ext.ux.plugin.ContainerStoreProgress} combo This container
             * @param {Number} total Total number of stores attached to container
             * @param {Number} completed Current number of finished stores
             */
            'startprogress',
            /**
             * @event progressupdate
             * Fires whenever any attached store emits 'load' (finished load) event
             * @param {Ext.ux.plugin.ContainerStoreProgress} combo This container
             * @param {Number} total Total number of stores attached to container
             * @param {Number} completed Current number of finished stores
             */
            'progressupdate',
            /**
             * @event endprogress
             * Fires when all attached stores have emitted 'beforeload',
             * and subsequently 'load' event each
             * @param {Ext.ux.plugin.ContainerStoreProgress} combo This container
             * @param {Number} total Total number of stores attached to container
             */
            'endprogress'
        );

    },

    // private
    onAfterLayout: function() {
        // Implement the watching
        this.addStoreWatchers();
    },

    /**
     * Attaches the progress bar onto the stores liked to this store
     *
     * @returns {unresolved}
     */
    addStoreWatchers: function () {

        var container;
        if (typeof this.cmp.getForm === 'function') {
            container = this.cmp.getForm();
        } else {
            container = this.cmp;
        }


        if (container.store) {
            // This item is actually the form so add it
            this.addStore(container);
        } else if (container.items && container.items.items) {
            var oThis = this;
            Ext.each (container.items.items, function(item) {
                oThis.addStore(item);
            }, container);
        }

        return this;
    },

    // private
    watchList : {},

    // private
    progressOn : false,

    // private
    addStore : function funcHandle (item) {
        var oThis = this;
        // Check if this item is a container, then index the child instead
        if (item.items && item.items.items && item.items.items.length > 0) {
            // Call function again with self
            Ext.each (item.items.items, function (it) {
                funcHandle(it);
            });
        } else {

            if (undefined !== item.store || (typeof item.getStore === 'function')) {
                var name = item.getName(), store = item.store || item.getStore();
                // We'll use this to set up the size. Do not remove of progress
                this.watchList[name] = {};
                // Subscript to the before load
                store.on('beforeload', function () {
                    this.watchList[name]['state'] = oThis.STATE_LOADING;
                    this.checkStoreStates();
                }, this);
                // Subscript to the after load
                store.on('load', function () {
                    this.watchList[name]['state'] = oThis.STATE_DONE;
                    this.checkStoreStates();
                }, this);
            }
        }
    },
    /**
     * Progress Bar Related methods
     */
    checkStoreStates : function () {
        var total = 0, completed = 0;
        for (var name in this.watchList) {
            if (this.watchList.hasOwnProperty(name)) {
                var ele = this.watchList[name];
                if (undefined !== ele.state) {
                    // Count...
                    total++;
                    // On increment if element is done
                    completed = (this.STATE_DONE !== ele.state ? completed : (completed + 1));
                }
            }
        };

        if (total > 0) {
            // Show or hide the progress bar
            if (!this.progressOn) {
                this.progressOn = true;
                this.onStartProgress(total, completed);
            }

            if (this.progressOn) {
                this.onUpdateProgress(total, completed);
            }

            if (completed === total && this.progressOn) {
                this.progressOn = false;
                var oThis       = this;
                // Wait a little while before triggering
                setTimeout(function() {
                    oThis.onEndProgress(total);
                }, 200);
            }
        }

        return completed;
    },

    /**
     * Shows the progress bar
     * @returns {undefined}
     */
    onStartProgress : function(total, completed) {
        Ext.MessageBox.show({
           title        : this.title,
           msg          : this.message,
           progressText : this.progressText,
           width        : this.width,
           progress     : this.progress,
           closable     : this.closable,
           animEl       : this.animEl
       });

        this.fireEvent('startprogress', this, total, completed);
    },


    onUpdateProgress : function(total, completed) {
        var p = (completed + 1) / (total + 1); // Adding 1 to both sides to correct zero offset
        Ext.MessageBox.updateProgress(p, Math.round(p * 100) + '% ' +  this.completenessText);
        this.fireEvent('progressupdate', this, total, completed);
    },

    onEndProgress : function(total) {
        Ext.MessageBox.hide();
        this.fireEvent('endprogress', this, total);
    }

});
