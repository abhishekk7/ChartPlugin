define(["app", "hbs!templates/apps/network/create/title_view_template",
        "hbs!templates/apps/network/create/network_layout_template",
        "hbs!templates/apps/network/create/create_network_view_template"
    ],
    function (OS, titleTemplate, layoutTemplate, createNetworkTemplate) {
        OS.module("NetworkApp.Create", function (Create, OS, Backbone, Marionette, $, _) {
            Create.TitleView = Marionette.ItemView.extend({
                template: titleTemplate,
                className: 'col-md-12',
                events: {
                    'click .js-back-network-manager': 'navigateTo'
                },
                navigateTo: function () {
                    OS.trigger('screen:network:list');
                }
            });

            Create.LayoutView = Marionette.LayoutView.extend({
                template: layoutTemplate,
                regions: {
                    networkCreateRegion: '#network-create-region'
                }
            });

            Create.CreateNetworkView = Marionette.ItemView.extend({
                template: createNetworkTemplate,
                className: 'col-md-12',
                events: {
                    'click .js-create-network': 'createNetwork',
                    'click .js-cancel': 'cancelNetwork'
                },
                cancelNetwork: function () {
                    OS.trigger('screen:network:list');
                },
                initialize: function () {
                    Backbone.Validation.bind(this);
                },

                createNetwork: function () {
                    /*Updating model*/
                    this.model.get('network').name = this.$('.js-network-name').val();
                    this.model.get('network').tenant_id = this.$('.js-project-dropdown  option:selected').val();
                    this.model.get('network').admin_state_up = this.$('.js-admin-state-dropdown  option:selected').val();
                    if (this.options.isAdmin) {
                        /*  this.model.get('network').segments = [
                         {
                         'provider:network_type': this.$('.js-network-type-dropdown  option:selected').val()
                         }
                         ];*/
                        this.model.get('network')['provider:network_type'] = this.$('.js-network-type-dropdown  option:selected').val();
                        this.model.get('network').shared = this.$('.js-shared-network').is(':checked');
                        this.model.get('network')['router:external'] = this.$('.js-external-network').is(':checked');
                    }
                    if (this.model.isValid(true)) {
                        /*Trigger event for Create Network*/
                        this.trigger('create:network');
                    }

                },

                serializeData: function () {
                    var data = {};
                    if (this.model) {
                        data = this.model.toJSON();
                        data.projects = this.options.projects.toJSON();
                        data.isAdmin = this.options.isAdmin;
                    }
                    return data;
                },

                onShow: function () {
                    this.$('select').selectmenu();
                    if (!this.options.isAdmin) {
                        this.$('.js-network-type-dropdown').selectmenu("option", "disabled", true);
                    }
                }

            });
        });
    });
