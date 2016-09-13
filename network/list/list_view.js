define(["app", "hbs!templates/apps/network/list/title_view_template",
    "hbs!templates/apps/network/list/network_layout_template",
    "hbs!templates/apps/network/list/subnet_layout_template",
    "hbs!templates/apps/network/list/port_layout_template",
    "hbs!templates/apps/network/list/network_filter_view_template",
    "hbs!templates/apps/network/list/subnet_filter_view_template",
    "hbs!templates/apps/network/list/port_filter_view_template",
    "hbs!templates/apps/network/list/subnet_create_view_template",
    "hbs!templates/apps/network/list/port_create_view_template",
    "hbs!templates/apps/network/list/network_grid_view_template",
    "hbs!templates/apps/network/list/subnet_grid_view_template",
    "hbs!templates/apps/network/list/port_grid_view_template",
    "hbs!templates/apps/network/list/network_grid_row_view_template",
    "hbs!templates/apps/network/list/subnet_grid_row_view_template",
    "hbs!templates/apps/network/list/port_grid_row_view_template",
    "hbs!templates/apps/network/list/network_edit_sub_view_template",
    "hbs!templates/apps/network/list/subnet_edit_sub_view_template",
    "hbs!templates/apps/network/list/port_edit_sub_view_template",
    "hbs!templates/apps/network/list/network_detail_sub_view_template",
    "hbs!templates/apps/network/list/subnet_detail_sub_view_template",
    "hbs!templates/apps/network/list/port_detail_sub_view_template",
    "hbs!templates/apps/network/list/network_topology_view_template",
    "hbs!templates/apps/instance/list/modal_log_view_template"
],
    function (OS, titleTemplate, layoutTemplate, subnetLayoutTemplate, portLayoutTemplate, networkFilterTemplate, subnetFilterTemplate, portFilterTemplate, subnetCreateTemplate, portCreateTemplate, networkGridTemplate, subnetGridTemplate, portGridTemplate, networkGridRowTemplate, subnetGridRowTemplate, portGridRowTemplate, networkEditSubTemplate, subnetEditSubTemplate, portEditSubTemplate, networkDetailSubTemplate, subnetDetailSubTemplate, portDetailSubTemplate, networkTopologyTemplate, modalViewTemplate) {

        OS.module("NetworkApp.List", function (List, OS, Backbone, Marionette, $, _) {

            List.TitleView = Marionette.ItemView.extend({
                template: titleTemplate,
                className: 'col-md-12',
                events: {
                    'click .js-toggle-topology': 'toggleTopology'
                },
                toggleTopology: function (e) {
                    var el = this.$('.js-toggle-topology'),
                        icon = el.find('.fa'),
                        collapse;
                    if (icon.hasClass('fa-plus-circle')) {
                        collapse = false;
                        icon.removeClass('fa-plus-circle');
                        icon.addClass('fa-minus-circle');
                    } else {
                        collapse = true;
                        icon.removeClass('fa-minus-circle');
                        icon.addClass('fa-plus-circle');
                    }
                    this.trigger('toggle:topology', collapse);

                }
            });

            List.LayoutView = Marionette.LayoutView.extend({
                template: layoutTemplate,
                regions: {
                    networkTopologyRegion: '#network-topology-region',
                    networkFilterRegion: '#network-filter-region',
                    networkGridRegion: '#network-grid-region'
                }
            });

            List.SubnetLayoutView = Marionette.LayoutView.extend({
                template: subnetLayoutTemplate,
                className: 'sub-expanded-row',
                regions: {
                    subnetFilterRegion: '#subnet-filter-region',
                    subnetCreateRegion: '#subnet-create-region',
                    subnetGridRegion: '#subnet-grid-region'
                }
            });

            List.PortLayoutView = Marionette.LayoutView.extend({
                template: portLayoutTemplate,
                className: 'sub-expanded-row',
                regions: {
                    portFilterRegion: '#port-filter-region',
                    portCreateRegion: '#port-create-region',
                    portGridRegion: '#port-grid-region'
                }
            });

            List.NetworkFilterView = Marionette.ItemView.extend({
                template: networkFilterTemplate,
                className: 'col-md-12',
                events: {
                    'click .js-filter-networks': 'filterNetworks',
                    'click .js-create-network': 'createNetwork',
                    'click .js-delete-networks': 'deleteNetworks',
                    'keypress #network-manager-autocomplete': 'checkEnter'
                },

                checkEnter: function (e) {
                    if (e.which === 13) {
                        e.preventDefault();
                        this.$('.js-filter-networks').click();
                    }
                },

                filterNetworks: function (e) {
                    this.trigger('filter:networks', this.$('#network-manager-autocomplete').val());
                },

                createNetwork: function (e) {
                    OS.trigger('screen:network:create');
                },

                deleteNetworks: function () {
                    $('#loading-mask').css('display', 'block');
                    this.trigger('networks:delete');
                },

                onShow: function () {
                    this.$("#network-manager-autocomplete").autocomplete({
                        source: this.model.get('networks')
                    });
                }
            });

            List.SubnetFilterView = Marionette.ItemView.extend({
                template: subnetFilterTemplate,
                className: 'col-md-12',
                events: {
                    'click .js-create-subnet': 'createSubnet',
                    'click .js-delete-subnets': 'deleteSubnets'
                },

                createSubnet: function () {
                    this.trigger('create:subnet');
                },

                deleteSubnets: function () {
                    $('#loading-mask').css('display', 'block');
                    this.trigger('subnets:delete');
                }
            });

            List.PortFilterView = Marionette.ItemView.extend({
                template: portFilterTemplate,
                className: 'col-md-12',
                events: {
                    'click .js-create-port': 'createPort',
                    'click .js-delete-ports': 'deletePorts'
                },

                createPort: function () {
                    this.trigger('create:port');
                },

                deletePorts: function () {
                    $('#loading-mask').css('display', 'block');
                    this.trigger('ports:delete');
                }
            });

            List.SubnetCreateView = Marionette.ItemView.extend({
                template: subnetCreateTemplate,
                className: 'col-md-12',
                events: {
                    'click .js-save-subnet': 'saveSubnet',
                    'click .js-cancel': 'cancelView'

                },
                initialize: function () {
                    Backbone.Validation.bind(this);
                },
                saveSubnet: function () {
                    function getDnsNameServers(dnsNameServers) {
                        return dnsNameServers.split('\n');
                    }

                    function getAllocationPools(allocationPools) {
                        var poolArray = allocationPools.split('\n'),
                            finalPool = [];
                        _.each(poolArray, function (pool) {
                            var splitPool = pool.split(',');
                            finalPool.push({start: splitPool[0], end: splitPool[1]});
                        });
                        return finalPool;
                    }

                    function getHostRoutes(hostRoutes) {
                        var hostArray = hostRoutes.split('\n'),
                            finalHost = [];
                        _.each(hostArray, function (host) {
                            var splitHost = host.split(',');
                            finalHost.push({destination: splitHost[0], nexthop: splitHost[1]});
                        });
                        return finalHost;
                    }

                    this.model.get('subnet').name = this.$('.js-subnet-name').val();
                    this.model.get('subnet').cidr = this.$('.js-network-address').val();
                    this.model.get('subnet').network_id = this.options.networkId;
                    if (!this.$('.js-disable-gateway').is(':checked')) {
                        this.model.get('subnet').gateway_ip = this.$('.js-gateway-ip').val();
                    }
                    this.model.get('subnet').enable_dhcp = this.$('.js-enable-dhcp').is(':checked');
                    this.model.get('subnet').ip_version = this.$('.js-ip-version-dropdown').val();

                    if (this.model.get('subnet').ip_version === 6) {
                        this.model.get('subnet').ipv6_address_mode = this.$('.js-ipv6-dropdown').val();
                    }
                    var dnsNameServers = this.$('.js-dns-name').val(),
                        allocationPools = this.$('.js-allocation-pools').val(),
                        hostRoutes = this.$('.js-host-routes').val();
                    if (dnsNameServers !== "") {
                        this.model.get('subnet').dns_nameservers = getDnsNameServers(dnsNameServers);
                    } else {
                        this.model.set('subnet', _.omit(this.model.get('subnet'), 'dns_nameservers'));
                    }
                    if (hostRoutes !== "") {
                        this.model.get('subnet').host_routes = getHostRoutes(hostRoutes);
                    } else {
                        this.model.set('subnet', _.omit(this.model.get('subnet'), 'host_routes'));
                    }
                    if (allocationPools !== "") {
                        this.model.get('subnet').allocation_pools = getAllocationPools(allocationPools);
                    } else {
                        this.model.set('subnet', _.omit(this.model.get('subnet'), 'allocation_pools'));
                    }
                    if (this.model.isValid(true)) {
                        this.trigger('save:subnet');
                    }
                },
                cancelView: function () {
                    this.trigger('cancel:view');
                },

                onShow: function () {
                    this.$("select").selectmenu();
                    this.$('[data-toggle="tooltip"]').tooltip({
                        container: 'body',
                        placement: 'bottom'
                    });
                }
            });

            List.PortCreateView = Marionette.ItemView.extend({
                template: portCreateTemplate,
                className: 'col-md-12',
                events: {
                    'click .js-save-port': 'savePort',
                    'click .js-cancel': 'cancelView'

                },
                initialize: function () {
                    Backbone.Validation.bind(this);
                },

                serializeData: function () {
                    var data = {};
                    data.subnets = this.options.subnets;
                    return data;
                },

                savePort: function () {
                    this.model.get('port').name = this.$('.js-port-name').val();
                    this.model.get('port').admin_state_up = this.$('.js-admin-state-dropdown').val();
                    this.model.get('port').network_id = this.options.networkId;
                    this.model.get('port').fixed_ips = [];
                    this.model.get('port').fixed_ips.push({subnet_id: this.$('.js-subnet-dropdown').val()});
                    if (this.model.isValid(true)) {
                        this.trigger('save:port');
                        this.trigger('cancel:view');
                    }

                },

                cancelView: function () {
                    this.trigger('cancel:view');
                },

                onShow: function () {
                    this.$("select").selectmenu();
                }
            });

            List.NetworkEditSubView = Marionette.ItemView.extend({
                template: networkEditSubTemplate,
                className: 'col-md-12',
                events: {
                    'click .js-cancel': 'closeView',
                    'click .js-edit-network': 'editNetwork'

                },
                closeView: function () {
                    this.trigger('close:view');
                },
                initialize: function () {
                    Backbone.Validation.bind(this);
                },
                editNetwork: function () {
                    /*Updating model*/
                    this.model.get('network').name = this.$('.js-network-name').val();
                    this.model.get('network').admin_state_up = this.$('.js-admin-state-dropdown  option:selected').val();
                    if (this.options.isAdmin) {
                        this.model.get('network').shared = this.$('.js-shared-network').is(':checked');
                        this.model.get('network')['router:external'] = this.$('.js-external-network').is(':checked');
                    }
                    if (this.model.isValid(true)) {
                        this.trigger('edit:network');
                    }
                },

                onShow: function () {
                    this.$('select').selectmenu();
                    this.$('.js-admin-state-dropdown').val(this.model.get('admin_state_up'));
                    this.$('.js-external-network').prop('checked', this.model.get('router:external'));
                    this.$('.js-shared-network').prop('checked', this.model.get('shared'));

                }
            });

            List.SubnetEditSubView = Marionette.ItemView.extend({
                template: subnetEditSubTemplate,
                className: 'col-md-12',
                events: {
                    'click .js-cancel': 'closeView',
                    'click .js-save-changes': 'editSubnet'

                },
                closeView: function () {
                    this.trigger('close:view');
                },
                initialize: function () {
                    Backbone.Validation.bind(this);
                },
                editSubnet: function () {
                    function getDnsNameServers(dnsNameServers) {
                        return dnsNameServers.split('\n');
                    }

                    function getAllocationPools(allocationPools) {
                        var poolArray = allocationPools.split('\n'),
                            finalPool = [];
                        _.each(poolArray, function (pool) {
                            var splitPool = pool.split(',');
                            finalPool.push({start: splitPool[0], end: splitPool[1]});
                        });
                        return finalPool;
                    }

                    function getHostRoutes(hostRoutes) {
                        var hostArray = hostRoutes.split('\n'),
                            finalHost = [];
                        _.each(hostArray, function (host) {
                            var splitHost = host.split(',');
                            finalHost.push({destination: splitHost[0], nexthop: splitHost[1]});
                        });
                        return finalHost;
                    }

                    this.model.get('subnet').name = this.$('.js-subnet-name').val();
                    if (!this.$('.js-disable-gateway').is(':checked')) {
                        this.model.get('subnet').gateway_ip = this.$('.js-gateway-ip').val();
                    }
                    this.model.get('subnet').enable_dhcp = this.$('.js-enable-dhcp').is(':checked');

                    if (this.model.get('subnet').ip_version === 6) {
                        this.model.get('subnet').ipv6_address_mode = this.$('.js-ipv6-dropdown').val();
                    }
                    var dnsNameServers = this.$('.js-dns-name').val(),
                        hostRoutes = this.$('.js-host-routes').val();
                    if (dnsNameServers !== "") {
                        this.model.get('subnet').dns_nameservers = getDnsNameServers(dnsNameServers);
                    } else {
                        this.model.get('subnet').dns_nameservers = [];
                    }
                    if (hostRoutes !== "") {
                        this.model.get('subnet').host_routes = getHostRoutes(hostRoutes);
                    } else {
                        this.model.get('subnet').host_routes = [];
                    }

                    if (this.model.isValid(true)) {
                        this.trigger('edit:subnet');
                        this.trigger('close:view');
                    }
                },

                onShow: function () {
                    this.$('select').selectmenu();
                    this.$('[data-toggle="tooltip"]').tooltip({
                        container: 'body',
                        placement: 'bottom'
                    });

                    var nameServerFinal = '',
                        count = this.model.get('dns_nameservers').length;
                    _.each(this.model.get('dns_nameservers'), function (nameServer) {
                        nameServerFinal += nameServer;
                        if (count > 1) {
                            nameServerFinal += '\n';
                        }
                        --count;
                    });
                    this.$('.js-dns-name').val(nameServerFinal);

                    var hostRoutesFinal = '';
                    count = this.model.get('host_routes').length;
                    _.each(this.model.get('host_routes'), function (hostRoute) {
                        hostRoutesFinal += hostRoute.destination + ',' + hostRoute.nexthop;
                        if (count > 1) {
                            hostRoutesFinal += '\n';
                        }
                        --count;
                    });
                    this.$('.js-host-routes').val(hostRoutesFinal);
                }
            });

            List.PortEditSubView = Marionette.ItemView.extend({
                template: portEditSubTemplate,
                className: 'col-md-12',
                events: {
                    'click .js-cancel': 'closeView',
                    'click .js-save-changes': 'editPort'

                },
                closeView: function () {
                    this.trigger('close:view');
                },
                initialize: function () {
                    Backbone.Validation.bind(this);
                },
                editPort: function () {
                    this.model.get('port').name = this.$('.js-port-name').val();
                    this.model.get('port').admin_state_up = this.$('.js-admin-state-dropdown').val();

                    /*Updating model*/
                    if (this.model.isValid(true)) {
                        this.trigger('edit:port');
                        this.trigger('close:view');
                    }
                },

                onShow: function () {
                    this.$('select').selectmenu();
                }
            });

            List.NetworkDetailSubView = Marionette.ItemView.extend({
                template: networkDetailSubTemplate,
                className: 'col-md-12',
                serializeData: function () {
                    var data = {};
                    if (this.model) {
                        data = this.model.toJSON();
                        data.external = data['router:external'];
                    }
                    return data;
                },
                onShow: function () {

                }
            });

            List.SubnetDetailSubView = Marionette.ItemView.extend({
                template: subnetDetailSubTemplate,
                className: 'col-md-12',
                onShow: function () {

                }
            });

            List.PortDetailSubView = Marionette.ItemView.extend({
                template: portDetailSubTemplate,
                className: 'col-md-12',
                onShow: function () {

                }
            });

            List.SubnetGridRowView = OS.Common.Views.GridItemView.extend({
                template: subnetGridRowTemplate,

                addChildView: function ($el, column) {
                    var view;

                    if (column === 'js-name') {
                        view = new List.SubnetDetailSubView({
                            model: this.model
                        });
                    }
                    else {
                        view = new List.SubnetEditSubView({
                            model: this.model
                        });
                    }

                    view.render();
                    $el.replaceWith(view.el);
                    view.onShow();
                    this.addChildViewEventForwarding(view);
                    this.options.customChildViews.push(view);
                    this.options.subCustomChildView.push(view);
                }
            });

            List.PortGridRowView = OS.Common.Views.GridItemView.extend({
                template: portGridRowTemplate,

                addChildView: function ($el, column) {
                    var view;

                    if (column === 'js-name') {
                        view = new List.PortDetailSubView({
                            model: this.model
                        });
                    }
                    else {
                        view = new List.PortEditSubView({
                            model: this.model
                        });
                    }

                    view.render();
                    $el.replaceWith(view.el);
                    view.onShow();
                    this.addChildViewEventForwarding(view);
                    this.options.customChildViews.push(view);
                    this.options.subCustomChildView.push(view);
                }
            });

            List.NetworkGridRowView = OS.Common.Views.GridItemView.extend({
                template: networkGridRowTemplate,

                serializeData: function () {
                    var data = {};
                    if (this.model) {
                        data = this.model.toJSON();
                        data.status = data.status.toUpperCase();
                        data.availableIps = 0;
                        if (data.subnets.length > 0) {
                            data.subnets.each(function (subnet) {
                                data.availableIps += this.getAvailableIps(subnet.get('cidr'));
                            }, this);
                            data.availableIps = data.availableIps - (data.instances.length + data.routers.length + 2);
                        }
                    }
                    return data;
                },

                getAvailableIps: function (cidr) {
                    var networkString = cidr.split('/'),
                        mask = parseInt(networkString[1]);
                    return Math.pow(2, (32 - mask));
                },

                addChildView: function ($el, column) {
                    var view, gridView = false;
                    if (column === 'js-name') {
                        view = new List.NetworkDetailSubView({
                            model: this.model
                        });
                    } else if (column === 'js-edit-network') {
                        view = new List.NetworkEditSubView({
                            model: this.model,
                            isAdmin: this.options.isAdmin
                        });
                    } else if (column === 'js-view-subnets') {
                        gridView = true;
                        view = new List.SubnetLayoutView();
                        view.render();
                        $el.replaceWith(view.el);

                        var subCustomChildView = [];
                        var subnetGridView = new List.SubnetGridView({
                            collection: this.model.get('subnets'),
                            customChildViews: this.options.customChildViews,
                            subCustomChildView: subCustomChildView
                        });

                        subnetGridView.on('toggle:display:delete', function (selectedCount) {
                            if (selectedCount > 0) {
                                subnetFilterView.$('.js-delete-subnets').prop("disabled", "");
                            } else {
                                subnetFilterView.$('.js-delete-subnets').prop("disabled", "disabled");
                            }
                        });

                        subnetGridView.on('grid:sort', function (fieldName, desc) {
                            subnetGridView.collection.sortCollection(fieldName, desc);
                            subnetGridView.emptyChildRows();
                            subnetGridView.subCustomChildView = [];
                            subnetGridView.onShow();
                        });

                        view.subnetGridRegion.show(subnetGridView);
                        this.addChildViewEventForwarding(subnetGridView);

                        var subnetFilterView = new List.SubnetFilterView({
                            layoutView: view,
                            networkId: this.model.get('id'),
                            gridView: subnetGridView
                        });

                        view.subnetFilterRegion.show(subnetFilterView);
                        this.addChildViewEventForwarding(subnetFilterView);
                    }
                    else {
                        gridView = true;
                        view = new List.PortLayoutView();
                        view.render();
                        $el.replaceWith(view.el);

                        var subCustomChildView = [];
                        var portGridView = new List.PortGridView({
                            collection: this.model.get('ports'),
                            customChildViews: this.options.customChildViews,
                            subCustomChildView: subCustomChildView
                        });

                        portGridView.on('toggle:display:delete', function (selectedCount) {
                            if (selectedCount > 0) {
                                portFilterView.$('.js-delete-ports').prop("disabled", "");
                            } else {
                                portFilterView.$('.js-delete-ports').prop("disabled", "disabled");
                            }
                        });

                        portGridView.on('grid:sort', function (fieldName, desc) {
                            portGridView.collection.sortCollection(fieldName, desc);
                            portGridView.emptyChildRows();
                            portGridView.subCustomChildView = [];
                            portGridView.onShow();
                        });

                        view.portGridRegion.show(portGridView);
                        this.addChildViewEventForwarding(portGridView);

                        var portFilterView = new List.PortFilterView({
                            layoutView: view,
                            networkId: this.model.get('id'),
                            subnets: this.model.get('subnets').toJSON(),
                            gridView: portGridView
                        });

                        view.portFilterRegion.show(portFilterView);
                        this.addChildViewEventForwarding(portFilterView);
                    }

                    if (!gridView) {
                        view.render();
                        $el.replaceWith(view.el);
                        view.onShow();
                    }
                    this.addChildViewEventForwarding(view);
                    this.options.customChildViews.push(view);
                }
            });

            List.SubnetGridView = OS.Common.Views.GridCompositeView.extend({
                template: subnetGridTemplate,
                childView: List.SubnetGridRowView,

                childViewOptions: function () {
                    return {
                        colspan: 6,
                        customChildViews: this.options.customChildViews,
                        subCustomChildView: this.options.subCustomChildView
                    }
                }
            });

            List.PortGridView = OS.Common.Views.GridCompositeView.extend({
                template: portGridTemplate,
                childView: List.PortGridRowView,

                childViewOptions: function () {
                    return {
                        colspan: 7,
                        customChildViews: this.options.customChildViews,
                        subCustomChildView: this.options.subCustomChildView
                    }
                }
            });

            List.NetworkGridView = OS.Common.Views.GridCompositeView.extend({
                template: networkGridTemplate,
                childView: List.NetworkGridRowView,

                childViewOptions: function () {
                    return {
                        colspan: 5,
                        customChildViews: this.options.customChildViews
                    }
                }

            });

            List.NetworkTemplateView = Marionette.ItemView.extend({
                template: networkTopologyTemplate,
                className: 'col-md-12',
                events: {
                    'click .close': 'closeClicked',
                    'click .js-terminate-instance': 'terminateInstance',
                    'click .js-open-log': 'openLog',
                    'click .js-open-console': 'openConsole'
                },

                openLog: function (e) {
                    e.preventDefault();
                    this.trigger('server:log', $(e.target).attr('data-id'));
                },

                openConsole: function (e) {
                    e.preventDefault();
                    this.trigger('server:console', $(e.target).attr('data-id'));
                },

                toggleTopology: function (collapse) {
                    var topology = this.$('.well');
                    if (collapse) {
                        topology.addClass('collapse');
                    } else {
                        topology.removeClass('collapse');
                    }
                },

                terminateInstance: function (e) {
                    var data = {};
                    data.id = this.$(e.target).attr('data-id');
                    data.name = this.$(e.target).attr('data-name');
                    this.trigger('terminate:instance', data)
                },

                closeClicked: function () {
                    this.$('.popover').css('display', 'none');
                },

                onShow: function () {
                    var graphData = this.collection.toJSON();
                    this.makeGraph(graphData);
                },

                makeGraph: function (data) {
                    this.canvasEl = this.$('#topologyCanvas');
                    this.canvas = this.canvasEl[0];
                    this.context = this.canvas.getContext('2d');

                    this.config = {
                        extFillColor: '#0066FF',
                        fillColor: ['#FFA347', '#00CCCC', '#7ACC7A', '#FF4D4D', '#6780A6'],
                        innerTextColor: '#FFFFFF',
                        outerTextColor: '#333333',
                        startingPointX: 50,
                        startingPointY: 50,
                        width: 15,
                        height: 400,
                        conWidth: 40,
                        conHeight: 2.5,
                        conSpacing: 60,
                        nodeWidth: 87,
                        nodeHeight: 56
                    };

                    this.nodeList = [];

                    this.adjustFactorY = (this.config.nodeHeight - 20) / data.length;

                    this.canvas.width = (data.length + 1) * (this.config.width + (2 * this.config.conWidth) + this.config.nodeWidth);
                    var requiredHeight = (this.config.nodeHeight + this.config.conSpacing) * this.options.maxNodeCount;
                    this.config.height = requiredHeight > this.config.height ? requiredHeight : this.config.height;
                    this.canvas.height = this.config.height + 100;

                    _.each(data, function (network, index) {
                        this.buildNetwork(index, network);
                    }, this);


                },

                buildNodeImage: function (node, adjustFactorX, idx) {
                    var xCod = this.config.startingPointX + adjustFactorX + this.config.width + this.config.conWidth,
                        yCod = (this.config.conSpacing * (idx + 1)) + this.config.startingPointY - (this.config.nodeHeight / 2),
                        self = this,
                        position = {};

                    position.left = this.canvas.offsetLeft + xCod + 20;
                    position.top = this.canvas.offsetTop + yCod + 20;

                    /*Added another canvas for image*/
                    this.$('#topologyCanvas').after('<canvas id=' + node.id + ' height=' + this.config.nodeHeight + ' width=' + this.config.nodeWidth + '> </canvas>');

                    var localCanvas = this.$('#' + node.id),
                        localContext = localCanvas[0].getContext('2d');
                    localCanvas.css('position', 'absolute');
                    localCanvas.css(position);

                    this.nodeList.push({
                        id: node.id,
                        name: node.name,
                        status: node.status,
                        x: xCod,
                        y: yCod,
                        idx: idx,
                        isRouter: node.isRouter,
                        interfaces: node.interfaces
                    });


                    localContext.beginPath();
                    localContext.strokeStyle = '#333333';
                    localContext.moveTo(15, 5);
                    localContext.lineTo(80, 5);
                    localContext.quadraticCurveTo(85, 5, 85, 15);
                    localContext.lineTo(85, 50);
                    localContext.quadraticCurveTo(85, 55, 80, 55);
                    localContext.lineTo(15, 55);
                    localContext.quadraticCurveTo(5, 55, 5, 50);
                    localContext.lineTo(5, 15);
                    localContext.closePath();
                    localContext.lineWidth = 3;
                    localContext.fillStyle = '#FFFFFF';
                    localContext.fill();
                    localContext.stroke();

                    localContext.beginPath();
                    localContext.arc(14, 14, 12, 0, 2 * Math.PI);
                    localContext.fillStyle = '#FFFFFF';
                    localContext.fill();
                    localContext.stroke();
                    localContext.beginPath();
                    localContext.moveTo(5, 40);
                    localContext.lineTo(85, 40);
                    localContext.lineTo(85, 50);
                    localContext.quadraticCurveTo(85, 55, 80, 55);
                    localContext.lineTo(15, 55);
                    localContext.quadraticCurveTo(5, 55, 5, 50);
                    localContext.lineTo(5, 40);
                    localContext.closePath();
                    localContext.fillStyle = '#333333';
                    localContext.fill();
                    localContext.stroke();

                    localContext.beginPath();
                    localContext.textAlign = "center";
                    localContext.font = "11px Graphie-Book";
                    localContext.fillStyle = "#333333";
                    localContext.fillText(fittingString(localContext, node.name, 50), 50, 28);
                    localContext.beginPath();
                    localContext.textAlign = "center";
                    localContext.font = "12px Graphie-Bold";
                    localContext.fillStyle = "#ffffff";


                    if (!node.isRouter) {
                        localContext.fillText("Instance", 45, 50);
                        localContext.beginPath();
                        localContext.fillStyle = "#333333";
                        localContext.fillRect(9, 8, 10, 1);
                        localContext.fillRect(9, 9, 2, 6);
                        localContext.fillRect(17, 9, 2, 6);
                        localContext.fillRect(9, 12, 10, 1);
                        localContext.fillRect(9, 15, 10, 6);
                        localContext.beginPath();
                        localContext.arc(12, 18, 2, 0, 2 * Math.PI, false);
                        localContext.fillStyle = 'green';
                        localContext.fill();
                    } else {
                        localContext.fillText("Router", 45, 50);
                        var routerSymbol = new Image();
                        routerSymbol.src = 'resources/theme/default/img/router_symbol.png';
                        routerSymbol.onload = function () {
                            localContext.scale(0.23, 0.23);
                            localContext.drawImage(routerSymbol, 27, 27);
                        }
                    }

                    localCanvas.on('mouseover', function (e) {
                        var selectedNode = _.find(self.nodeList, function (node) {
                            return node.id == this.id;
                        }, this);
                        var theHeight = $('.popover').height();

                        self.$('.popover').css('left', this.offsetLeft + self.config.nodeWidth + 10 + 'px');
                        if (selectedNode.isRouter)
                            self.$('.popover').css('top', (this.offsetTop + theHeight / 4 - self.config.nodeHeight / 2) - 10 + 'px');
                        else
                            self.$('.popover').css('top', (this.offsetTop + theHeight / 4 - self.config.nodeHeight / 2) + 'px');

                        self.$('.popover h4').html(selectedNode.name);
                        self.$('.popover .deviceId').html(selectedNode.id);
                        self.$('.popover .deviceId').attr('data-id', selectedNode.id);
                        self.$('.popover .deviceStatus').html(selectedNode.status.toUpperCase());

                        if (selectedNode.isRouter) {
                            self.$('.popover .js-open-log').hide();
                            self.$('.popover .js-open-console').hide();
                            self.$('.popover .js-terminate-instance').hide();
                            self.$('.popover .js-delete-router').show();
                            self.$('.popover .js-interfaces').html('');
                            self.$('.popover .js-interfaces').closest('tr').show();
                            _.each(selectedNode.interfaces, function (selectedInterface) {
                                self.$('.popover .js-interfaces').append('<div>' + selectedInterface.id + '</div>');
                            });

                            self.$('.popover .js-delete-router').attr('data-id', selectedNode.id);
                            self.$('.popover .js-delete-router').attr('data-name', selectedNode.name);
                        } else {
                            self.$('.popover .js-open-log').show();
                            self.$('.popover .js-open-console').show();
                            self.$('.popover .js-terminate-instance').show();
                            self.$('.popover .js-delete-router').hide();
                            self.$('.popover .js-interfaces').closest('tr').hide();

                            self.$('.popover .js-open-log').attr('data-id', selectedNode.id);
                            self.$('.popover .js-open-console').attr('data-id', selectedNode.id);

                            self.$('.popover .js-terminate-instance').attr('data-id', selectedNode.id);
                            self.$('.popover .js-terminate-instance').attr('data-name', selectedNode.name);
                        }

                        self.$('.popover').show();

                    });

                    function fittingString(c, str, maxWidth) {
                        var width = c.measureText(str).width;
                        var ellipsis = '...';
                        var ellipsisWidth = c.measureText(ellipsis).width;
                        if (width <= maxWidth || width <= ellipsisWidth) {
                            return str;
                        } else {
                            var len = str.length;
                            while (width >= maxWidth - ellipsisWidth && len-- > 0) {
                                str = str.substring(0, len);
                                width = c.measureText(str).width;
                            }
                            return str + ellipsis;
                        }
                    }
                },

                buildConnectionUnCommon: function (node, adjustFactorX, nodeOccupancy) {
                    var idx = _.indexOf(nodeOccupancy, false);
                    /*  Added for the case when all the allotted nodes are occupied by common nodes.
                     *  Though highly unlikely to happen.
                     */
                    if (idx == -1) {
                        idx = nodeOccupancy.length;
                    }
                    this.context.beginPath();
                    this.context.lineCap = "butt";
                    var startX = this.config.startingPointX + adjustFactorX + this.config.width,
                        startY = (this.config.conSpacing * (idx + 1)) + this.config.startingPointY,
                        endX = startX + this.config.conWidth;
                    this.context.lineWidth = this.config.conHeight;
                    this.context.moveTo(startX, startY);
                    this.context.lineTo(endX, startY);
                    this.context.stroke();
                    this.buildNodeImage(node, adjustFactorX, idx);
                    nodeOccupancy[idx] = true;
                },

                buildConnectionCommon: function (node, adjustFactorX, added, nodeOccupancy, networkIndex) {
                    var startX = this.config.startingPointX + adjustFactorX + this.config.width - 2,
                        startY = (this.config.conSpacing * (added.idx + 1)) + this.config.startingPointY - (this.config.nodeHeight / 2) + (this.adjustFactorY * (networkIndex + 1)),
                        endX = added.x + this.config.nodeWidth - 3,
                        endY = added.y + (this.config.nodeHeight / 2) - (this.config.nodeHeight / 2) + (this.adjustFactorY * (networkIndex + 1));
                    this.context.lineWidth = this.config.conHeight;
                    this.context.moveTo(startX, startY);
                    this.context.lineTo(endX, endY);
                    this.context.stroke();

                    nodeOccupancy[added.idx] = true;
                },

                buildNetwork: function (index, network) {
                    var adjustFactorX = index * (this.config.width + (2 * this.config.conWidth) + this.config.nodeWidth);

                    this.context.beginPath();
                    this.context.lineCap = "round";
                    this.context.moveTo(this.config.startingPointX + adjustFactorX + (this.config.width / 2), this.config.startingPointY);
                    this.context.lineTo(this.config.startingPointX + adjustFactorX + (this.config.width / 2), this.config.startingPointY + this.config.height);
                    this.context.lineWidth = this.config.width;
                    this.context.strokeStyle = network.ext ? this.config.extFillColor : this.config.fillColor[index % this.config.fillColor.length];
                    this.context.stroke();

                    var nodeOccupancy = [];

                    network.nodesToAttach = [];

                    _.each(network.routers, function (router) {
                        nodeOccupancy.push(false);
                        router.isRouter = true;
                        network.nodesToAttach.push(router);
                    });

                    _.each(network.instances, function (instance) {
                        nodeOccupancy.push(false);
                        network.nodesToAttach.push(instance);
                    });


                    if (this.nodeList.length > 0) {
                        _.each(network.nodesToAttach, function (node) {
                            var added = _.find(this.nodeList, function (elem) {
                                return elem.id == node.id;
                            });

                            if (added) {
                                this.buildConnectionCommon(node, adjustFactorX, added, nodeOccupancy, index);
                            }
                        }, this);
                    }

                    _.each(network.nodesToAttach, function (node) {
                        var added = _.find(this.nodeList, function (elem) {
                            return elem.id == node.id;
                        });

                        if (!added) {
                            this.buildConnectionUnCommon(node, adjustFactorX, nodeOccupancy);
                        }
                    }, this);

                    this.context.save();
                    this.context.translate(this.config.startingPointX + adjustFactorX + (this.config.width / 4), (this.config.startingPointY + this.config.height / 2));
                    this.context.rotate(0.5 * Math.PI);
                    this.context.fillStyle = this.config.innerTextColor;
                    this.context.textAlign = "center";
                    this.context.font = "14px Graphie-Bold";
                    this.context.fillText(network.name, 0, 0);
                    this.context.restore();

                    this.context.save();
                    this.context.translate(this.config.startingPointX + adjustFactorX + this.config.width + 5, this.config.startingPointY + this.config.height);
                    this.context.rotate(0.5 * Math.PI);
                    this.context.fillStyle = this.config.outerTextColor;
                    this.context.font = "11px Graphie-Book";
                    var networkAddresses = '',
                        netAddCount = network.subnets.length;
                    network.subnets.each(function (subnet) {
                        networkAddresses += subnet.get('cidr');
                        if (netAddCount > 1)
                            networkAddresses += ',';
                        --netAddCount;
                    });
                    this.context.textAlign = "end";
                    this.context.fillText(networkAddresses, 0, 0);
                    this.context.restore();

                }
            });

            List.ModalView = Marionette.ItemView.extend({
                template: modalViewTemplate,
                className: 'modal'
            });

        });
    })
;
