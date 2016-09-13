define(["app", "apps/network/create/create_view"], function (OS, View) {
    OS.module("NetworkApp.Create", function (Create, OS, Backbone, Marionette, $, _) {

        Create.Controller = Marionette.Controller.extend({
            initialize: function (options) {
                this.region = options.region || OS.mainRegion;
                this.titleRegion = options.titleRegion || OS.titleRegion;
            },

            show: function () {
                var titleView = new Create.TitleView();
                var layoutView = new Create.LayoutView();
                var self = this;
                var user = JSON.parse(OS.request('get:object:state', 'user'));
                var isAdmin = _.where(user.roles, {name: "admin"}).length > 0 ? true : false;
                var projects = OS.request('list:projects:user', {userId: user.id});

                $.when(projects).done(function (projects) {
                    self.titleRegion.show(titleView);
                    self.region.show(layoutView);
                    var createNetworkView = new Create.CreateNetworkView({
                        model: new OS.Entities.Network(),
                        projects: projects,
                        isAdmin: isAdmin
                    });
                    layoutView.networkCreateRegion.show(createNetworkView);

                    createNetworkView.on('create:network', function () {
                        var createNetwork = OS.request('create:network', {request: this.model});
                        $.when(createNetwork).done(function (createNetwork) {
                            OS.trigger('screen:network:list');
                        });
                    });
                });
            }
        });

    });
});
