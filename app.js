var app = angular.module('killdata', [ 'ui.bootstrap' ]);

app.controller('DataCtrl', function($scope, $http) {
    console.log('init controller ..');
    $scope.data = {};
    $scope.kills = 0;
    $scope.table = {};
    $scope.types = {};
    $scope.typesLoaded = false;
    $scope.typesCount = 0;
    $scope.lastkill = new Date();
    console.log('done');

    addData = function(key, value) {
        var num = $scope.data[key];
        if (isNaN(num))
            $scope.data[key] = {
                'name' : '',
                'count' : value
            };
        else
            $scope.data[key].count = $scope.data[key].count + value;
    };

    addNames = function() {
        if (!$scope.typesLoaded || $scope.kills < 2000)
            return;
        console.log('Types: ' + Object.keys($scope.types).length);
        var result = new Array();
        for (var key in $scope.data) {
            var entry = $scope.data[key];
            entry.name = $scope.types[key];
            result.push(entry);
        }
        result.sort(function(a, b) {
            return b.count - a.count;
        });
        $scope.table = result;
        console.log('Set names!');
    };
    
    getNames = function(url) {
        $http.get(url).success(function(result) {
            var total = result.totalCount;
            for ( var key in result.items) {
                var item = result.items[key];
                var id = item.href.replace('http://public-crest.eveonline.com/types/', '').replace('/', '');
                $scope.types[id] = item.name;
            }
            $scope.typesCount = Number((Object.keys($scope.types).length / total * 100).toFixed(1));
            var next = result.next;
            if (next != null && typeof next == 'object') {
                getNames(result.next.href);
            } else {
                $scope.typesLoaded = true;
                console.log('done ' + Object.keys($scope.types).length);
                addNames();
            }
        });
    };

    getKillData = function(region, page, reloads) {
        $scope.types = {};
        $http.get('https://zkillboard.com/api/loses/regionID/' + region + '/page/' + page + '/').success(function(result) {
            for ( var kill in result) {
                var ship = result[kill].victim.shipTypeID;
                addData(ship, 1);
                for ( var itemKey in result[kill].items) {
                    var item = result[kill].items[itemKey];
                    addData(item.typeID, item.qtyDropped + item.qtyDestroyed);
                }
                var time = new Date(result[kill].killTime);
                if(time < $scope.lastkill) {
                	$scope.lastkill = time;
                }
                $scope.kills = $scope.kills + 1;
            }
            addNames();
        })
        .error(function(result) {
            console.log('Could not load data: ' + result);
            if(reloads > 0) {
            	getKillData(region, page, reloads - 1);
            }
        });
    };

    getNames('http://public-crest.eveonline.com/types/');
    for (var page = 1; page < 11; page++) {
    	getKillData(10000060, page, 3);
    }
});
