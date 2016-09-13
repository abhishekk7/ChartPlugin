define(["app", "apps/network/create/create_controller", "apps/network/list/list_controller"], function (OS) {
    OS.module("NetworkApp", function (NetworkApp, OS, Backbone, Marionette, $, _) {
        NetworkApp.Router = OS.AppRouter.extend({
            appRoutes: {
                'network/new': 'createNetwork',
                'networks': 'listNetwork'
            }
        });
        var API = {
            createNetwork: function (options) {
                var controller = new NetworkApp.Create.Controller(options);
                controller.show();
            },

            listNetwork: function (options) {
                var controller = new NetworkApp.List.Controller(options);
                controller.show();
            }
        }

        OS.on('screen:network:create', function (options) {
            OS.navigate('network/new');
            API.createNetwork(options);
        });

        OS.on('screen:network:list', function (options) {
            OS.navigate('networks');
            API.listNetwork(options);
        });


        OS.addInitializer(function () {
            new NetworkApp.Router({
                controller: API
            });
        });
    });
});
