define(["app", "apps/network/list/list_view", 'backbone.paginator', "entities/subnet", "entities/port", "entities/router"], function (OS, View, PaginatedCollection) {
    OS.module("NetworkApp.List", function (List, OS, Backbone, Marionette, $, _) {

        List.Controller = Marionette.Controller.extend({
            initialize: function (options) {
                this.region = options.region || OS.mainRegion;
                this.titleRegion = options.titleRegion || OS.titleRegion;
                this.modalRegion = options.modalRegion || OS.modalRegion;
            },

            show: function () {
                var titleView = new List.TitleView();
                var layoutView = new List.LayoutView();
                var self = this;

                var networkCollection = OS.request('network:collection');
                var servers = OS.request('list:servers:detail');
                var subnets = OS.request('list:subnets');
                var ports = OS.request('list:ports', {isTenant: false});
                var routers = OS.request('list:routers');
                var user = JSON.parse(OS.request('get:object:state', 'user'));
                var isAdmin = _.where(user.roles, {name: "admin"}).length > 0 ? true : false;

                $.when(networkCollection, servers, subnets, ports, routers).done(function (networks, servers, subnets, ports, routers) {
                    self.isAdmin = isAdmin;
                    self.titleRegion.show(titleView);
                    self.region.show(layoutView);
                    self.layoutView = layoutView;

                    networks.each(function (network) {
                        network.set('subnets', subnets.filterSubnetsByNetwork(network.get('id')));
                        network.set('ports', ports.filterPortsByNetwork(network.get('id')));
                    });
                    self.maxNodeCount = 0;
                    self._processTopologyObject(networks, servers, routers, ports, self.maxNodeCount);

                    self.networks = networks;
                    self.servers = servers;
                    self.ports = ports;
                    self.routers = routers;

                    self.networksCopy = networks.toJSON();

                    self._createTopologyView();
                    titleView.on('toggle:topology', function (collapse) {
                        self.networkTopologyView.toggleTopology(collapse);
                    });

                    var networkFilterView = new List.NetworkFilterView({
                        model: networks.getFilterViewModel()
                    });

                    layoutView.networkFilterRegion.show(networkFilterView);

                    var customChildViews = [];
                    var networkGridView = new List.NetworkGridView({
                        //collection: networks,
                        collection: new PaginatedCollection(networks, {perPage: OS.Constants.pageSize}),
                        customChildViews: customChildViews,
                        isAdmin: self.isAdmin
                    });

                    networkFilterView.on('filter:networks', function (networkName) {
                        networks.filterNetworks(networkName, self.networksCopy);
                        self.restorePageViews();
                        networkGridView.sortGrid();
                    });

                    networkFilterView.on('networks:delete', function () {
                        self.modalRegion.reset();
                        var deleteNetworks = [];
                        var deleteNetworkNames = [];
                        _.each(networkGridView.$('.js-checkbox'), function (selectedNetwork) {
                            if (selectedNetwork.checked) {
                                deleteNetworks.push(selectedNetwork.id);
                                deleteNetworkNames.push(selectedNetwork.defaultValue);
                            }
                        });
                        var modalView = new OS.Common.Views.ModalView({
                            model: new Backbone.Model({
                                title: 'Confirm Delete Networks',
                                content: 'You have selected "' + deleteNetworkNames.join(',') + '". Please confirm your selection. This action cannot be undone.',
                                buttonLabel: 'Delete Networks'
                            })
                        });
                        self.modalRegion.show(modalView);
                        modalView.on('proceed:operation', function () {
                            self.modalRegion.closeModal();
                            var deleteOperation = OS.request('delete:networks', {
                                networks: networks,
                                networksCopy: self.networksCopy,
                                deleteNetworks: deleteNetworks
                            });
                            $.when(deleteOperation).done(function (networkArray) {
                                if (networkArray.length > 0) {
                                    OS.trigger('notification:notify', new OS.Entities.Notification({
                                        message: 'Networks ' + networkArray.join(',') + " are deleted Successfully.",
                                        type: OS.Entities.NotificationType.CONFIRMATION
                                    }));
                                    self.networksCopy = networks.toJSON();
                                }
                                self.networkTopologyView.render();
                                self.networkTopologyView.onShow();
                                networkGridView.toggleDisplayDeleteParent();
                                self.restorePageViews();
                            });
                        });
                    });

                    networkGridView.on('childview:fv:subnets:delete', function (iv, fv) {
                        self.modalRegion.reset();
                        var deleteSubnets = [];
                        var deleteSubnetNames = [];
                        _.each(fv.options.gridView.$('.js-checkbox'), function (selectedSubnet) {
                            if (selectedSubnet.checked) {
                                deleteSubnets.push(selectedSubnet.id);
                                deleteSubnetNames.push(selectedSubnet.defaultValue);
                            }
                        });
                        var modalView = new OS.Common.Views.ModalView({
                            model: new Backbone.Model({
                                title: 'Confirm Delete Subnets',
                                content: 'You have selected "' + deleteSubnetNames.join(',') + '". Please confirm your selection. This action cannot be undone.',
                                buttonLabel: 'Delete Subnets'
                            })
                        });
                        self.modalRegion.show(modalView);
                        modalView.on('proceed:operation', function () {
                            self.modalRegion.closeModal();
                            var deleteOperation = OS.request('delete:subnets', {
                                subnets: fv.options.gridView.collection,
                                deleteSubnets: deleteSubnets
                            });
                            $.when(deleteOperation).done(function (subnetArray) {
                                if (subnetArray.length > 0) {
                                    OS.trigger('notification:notify', new OS.Entities.Notification({
                                        message: 'Subnet(s) ' + subnetArray.join(',') + " deleted Successfully.",
                                        type: OS.Entities.NotificationType.CONFIRMATION
                                    }));
                                }
                                fv.options.gridView.toggleDisplayDeleteParent();
                                self.restoreChildGridViews(fv.options.gridView);
                            });
                        });
                    });

                    networkGridView.on('childview:fv:ports:delete', function (iv, fv) {
                        self.modalRegion.reset();
                        var deletePorts = [];
                        var deletePortNames = [];
                        _.each(fv.options.gridView.$('.js-checkbox'), function (selectedPort) {
                            if (selectedPort.checked) {
                                deletePorts.push(selectedPort.id);
                                deletePortNames.push(selectedPort.defaultValue);
                            }
                        });
                        var modalView = new OS.Common.Views.ModalView({
                            model: new Backbone.Model({
                                title: 'Confirm Delete Ports',
                                content: 'You have selected "' + deletePortNames.join(',') + '". Please confirm your selection. This action cannot be undone.',
                                buttonLabel: 'Delete Ports'
                            })
                        });
                        self.modalRegion.show(modalView);
                        modalView.on('proceed:operation', function () {
                            self.modalRegion.closeModal();
                            var deleteOperation = OS.request('delete:ports', {
                                ports: fv.options.gridView.collection,
                                deletePorts: deletePorts
                            });
                            $.when(deleteOperation).done(function (portArray) {
                                if (portArray.length > 0) {
                                    OS.trigger('notification:notify', new OS.Entities.Notification({
                                        message: 'Port(s) ' + portArray.join(',') + " deleted Successfully.",
                                        type: OS.Entities.NotificationType.CONFIRMATION
                                    }));
                                }
                                fv.options.gridView.toggleDisplayDeleteParent();
                                self.restoreChildGridViews(fv.options.gridView);
                            });
                        });
                    });

                    networkGridView.on('grid:sort', function (fieldName, desc) {
                        networks.sortCollection(fieldName, desc);
                        self.restorePageViews();
                    });

                    networkGridView.on('childview:fv:edit:network', function (iv, fv) {
                        var updateNetwork = OS.request('update:network', {network: fv.model});
                        $.when(updateNetwork).done(function (network) {
                            networks.set(network, {remove: false});
                            self.networksCopy = networks.toJSON();
                            networkGridView.render();
                            self.restorePageViews();
                        });
                    });

                    var createSubnetView;
                    networkGridView.on('childview:fv:create:subnet', function (iv, fv) {
                        createSubnetView = new List.SubnetCreateView({
                            model: new OS.Entities.Subnet(),
                            networkId: fv.options.networkId
                        });
                        createSubnetView.on('save:subnet', function () {
                            var createSubnet = OS.request('create:subnet', {request: this.model});
                            $.when(createSubnet).done(function (subnet) {
                                self.networks.filter(function (network) {
                                    if (network.get('id') === subnet.get('network_id')) {
                                        network.get('subnets').add(subnet);
                                    }
                                });

                            });
                        });
                        createSubnetView.on('cancel:view', function () {
                            fv.options.layoutView.subnetCreateRegion.empty();
                        });
                        fv.options.layoutView.subnetCreateRegion.show(createSubnetView);
                    });

                    var createPortView;
                    networkGridView.on('childview:fv:create:port', function (iv, fv) {
                        createPortView = new List.PortCreateView({
                            model: new OS.Entities.Port(),
                            networkId: fv.options.networkId,
                            subnets: fv.options.subnets
                        });
                        createPortView.on('save:port', function () {
                            var createPort = OS.request('create:port', {request: this.model});
                            $.when(createPort).done(function (port) {
                                fv.options.gridView.collection.add(port);
                            });
                        });
                        createPortView.on('cancel:view', function () {
                            fv.options.layoutView.portCreateRegion.empty();
                        });
                        fv.options.layoutView.portCreateRegion.show(createPortView);
                    });

                    networkGridView.on('childview:fv:childview:fv:edit:subnet', function (iv, fv, ifv) {
                        var updateSubnet = OS.request('update:subnet', {subnet: ifv.model});
                        $.when(updateSubnet).done(function (subnet) {
                            fv.collection.set(subnet, {remove: false});
                            fv.render();
                            fv.onShow();
                        });
                    });

                    networkGridView.on('childview:fv:childview:fv:edit:port', function (iv, fv, ifv) {
                        var updatePort = OS.request('update:port', {port: ifv.model});
                        $.when(updatePort).done(function (port) {
                            fv.collection.set(port, {remove: false});
                            fv.render();
                            fv.onShow();
                        });
                    });


                    networkGridView.on('childview:fv:childview:fv:close:view', function (iv, fv, ifv) {
                        ifv.closeView();
                    });


                    networkGridView.on('toggle:display:delete', function (selectedCount) {
                        if (selectedCount > 0) {
                            networkFilterView.$('.js-delete-networks').prop("disabled", "");
                        } else {
                            networkFilterView.$('.js-delete-networks').prop("disabled", "disabled");
                        }
                    });

                    networkGridView.on('childview:fv:close:view', function (iv, fv) {
                        iv.closeView();
                    });
                    networkGridView.on('restore:page:views', function () {
                        self.restorePageViews();
                    });
                    self.networkGridView = networkGridView;
                    layoutView.networkGridRegion.show(networkGridView);
                });


            },

            restorePageViews: function () {
                this.networkGridView.emptyChildRows();
                this.networkGridView.customChildViews = [];
                this.networkGridView.onShow();
            },

            restoreChildGridViews: function (view) {
                view.emptyChildRows();
                view.options.subCustomChildView = [];
                view.onShow();
            },

            _processTopologyObject: function (networks, instances, routers, ports, maxNodeCount) {
                var maxCount = 0;
                networks.each(function (network) {
                    var attachedInstances = [],
                        attachedRouters = [];
                    instances.each(function (instance) {
                        if (Object.keys(instance.get('addresses')).indexOf(network.get('name')) != -1) {
                            attachedInstances.push(instance.toJSON());
                        }
                    });
                    network.set('instances', attachedInstances);

                    var routerList = routers.filterRoutersByNetworkId(network);
                    _.each(routerList, function (router) {
                        attachedRouters.push(router);
                        router.interfaces = ports.filterPortsByRouterId(router.id).toJSON();
                    });
                    network.set('routers', attachedRouters);

                    var totalCount = attachedInstances.length + attachedRouters.length;
                    maxCount = totalCount > maxCount ? totalCount : maxCount;
                });

                this.maxNodeCount = maxCount;
            },

            _createTopologyView: function () {
                var self = this;
                var networkTopologyView = new List.NetworkTemplateView({
                    collection: self.networks,
                    maxNodeCount: self.maxNodeCount
                });
                self.networkTopologyView = networkTopologyView;
                self.layoutView.networkTopologyRegion.show(networkTopologyView);


                networkTopologyView.on('terminate:instance', function (data) {
                    self.modalRegion.reset();
                    var modalView = new OS.Common.Views.ModalView({
                        model: new Backbone.Model({
                            title: 'Confirm Termination of Instance',
                            content: 'Are you sure you want to terminate "' + data.name + '"? This action cannot be undone.',
                            buttonLabel: 'Terminate Instance'
                        })
                    });
                    self.modalRegion.show(modalView);
                    modalView.on('proceed:operation', function () {
                        self.modalRegion.closeModal();
                        var terminate = OS.request('terminate:instance', data);
                        $.when(terminate).done(function () {
                            self.servers.remove(data.id);
                            self._processTopologyObject(self.networks, self.servers, self.routers, self.ports, self.maxNodeCount);
                            self.networkTopologyView.render();
                            self.networkTopologyView.onShow();
                            self.networkGridView.render();
                            self.networkGridView.onShow();
                        });
                    });
                });

                networkTopologyView.on('server:log', function (id) {
                    var serverConsoleLog = OS.request('server:console:logs', {
                        serverId: id
                    });
                    $.when(serverConsoleLog).done(function (log) {
                        var modalView = new List.ModalView({
                            model: log
                        });
                        self.modalRegion.show(modalView);
                    })
                });

                networkTopologyView.on('server:console', function (id) {
                    var serverConsole = OS.request('server:console', {
                        serverId: id
                    });
                    $.when(serverConsole).done(function (consoleOutput) {
                        window.open(consoleOutput.get('console').url, "_blank");
                    })
                });

            }
        });

    });
});
