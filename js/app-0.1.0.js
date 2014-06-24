var app = angular.module('schedular-ui', [ 'ngRoute', 'restangular', 'ui.bootstrap', 'checklist-model' ]);

app.config(function(RestangularProvider) {
  RestangularProvider.setBaseUrl('http://localhost/scheduler-api/');
});

app.run(['Restangular', '$location', function(Restangular, $location) {
  Restangular.setErrorInterceptor(function(response, deferred, responseHandler) {
    if(response.status === 401) {
      $location.path('/auth');
      return false; // error handled
    }
    return true; // error not handled
  });
}]);

app.config(['$routeProvider', function($routeProvider) {
  $routeProvider
    .when('/auth',
      { controller: 'AuthController',   templateUrl: 'partials/auth.html' })
    .when('/logout',
      { controller: 'LogoutController', template: '', redirectTo: '/auth' })
    .when('/schedules',
      { controller: 'ScheduleListController',   templateUrl: 'partials/schedules.html' })

    .when('/schedules/new',
      { controller: 'ScheduleNewController',    templateUrl: 'partials/schedulesNew.html' })

    .when('/schedules/:scheduleId',
      { controller: 'ScheduleDetailController', templateUrl: 'partials/schedulesDetail.html' })

    .when('/schedules/:scheduleId/edit',
      { controller: 'ScheduleEditController',   templateUrl: 'partials/schedulesEdit.html' })

    .when('/schedules/:scheduleId/sub_schedule/new',
      { controller: 'SubScheduleNewController', templateUrl: 'partials/sub_scheduleNew.html' })

    .when('/schedules/:scheduleId/sub_schedule/:sub_scheduleId/edit',
      { controller: 'SubScheduleEditController', templateUrl: 'partials/sub_scheduleEdit.html' })

    .otherwise(
      { redirectTo: '/schedules' });
}]);

app.controller('LogoutController', ['$scope', '$location', 'Restangular', function($scope, $location, Restangular) {
  console.log('logout controller')
  Restangular.all('auth/logout').post($scope.auth).then(function($auth) {
    console.log($auth.username);
    $location.path('/schedules');
  }, function() {
    console.log("Error");
  });
}]);

app.controller('AuthController', ['$scope', '$location', 'Restangular', function($scope, $location, Restangular) {
  $scope.validate = function() {
    Restangular.all('auth/login').post($scope.auth).then(function($auth) {
      console.log($auth.username);
      $location.path('/schedules');
    }, function() {
      console.log("Error");
    });
  };
}]);

app.controller('ScheduleListController', ['$scope', '$location', 'Restangular', function($scope, $location, Restangular) {
  var schedules = Restangular.all('schedules');
  schedules.getList().then(function($schedules) {
    $scope.schedules = $schedules;
  });

  $scope.showDetail = function($schedule) {
    $location.path('/schedules/' + $schedule.id);
  }
}]);

app.controller('ScheduleDetailController', ['$scope', '$location', '$routeParams', 'Restangular', function($scope, $location, $routeParams, Restangular) {
  var schedule = Restangular.one('schedules/' + $routeParams.scheduleId);
  schedule.get().then(function($schedule) {
    $scope.schedule = $schedule;
  });

  $scope.edit = function($schedule) {
    $location.path('/schedules/' + $schedule.id + '/edit');
  }
}]);

app.controller('ScheduleNewController', ['$scope', '$location', 'Restangular', function($scope, $location, Restangular) {
  $scope.open = function($event) {
    $event.preventDefault();
    $event.stopPropagation();

    $scope.opened = true;
  };

  $scope.submit = function() {
    Restangular.all('schedules').post($scope.schedule).then(function($schedule) {
      console.log($schedule.id);
      $location.path('/schedules/' + $schedule.id + '/edit');
    }, function() {
      console.log("Error");
    });
  };
}]);

app.controller('ScheduleEditController', ['$scope', '$location', '$routeParams', 'Restangular', function($scope, $location, $routeParams, Restangular) {
  var schedule = Restangular.one('schedules', $routeParams.scheduleId);
  schedule.get().then(function($schedule) {
    $scope.schedule = $schedule;
  });

  $scope.open = function($event) {
    $event.preventDefault();
    $event.stopPropagation();

    $scope.opened = true;
  };

  $scope.addSubSchedule = function($schedule) {
    $location.path('/schedules/' + $schedule.id + '/sub_schedule/new');
  }

  $scope.editDetail = function($sub_schedule) {
    $location.path('/schedules/' + $sub_schedule.schedule_id + '/sub_schedule/' + $sub_schedule.id + '/edit')
  }

  $scope.save = function() {
    $scope.schedule.put().then(function($schedule) {
      $location.path('/schedules/' + $schedule.id + '/edit');
    }, function($schedule) {
      console.log('Error saving schedule');
    });
  }
}]);

app.controller('SubScheduleNewController', ['$scope', '$location', '$routeParams', 'Restangular', function($scope, $location, $routeParams, Restangular) {
  var schedule = Restangular.one('schedules', $routeParams.scheduleId);

  Restangular.all('assets').getList().then(function($resources) {
    $scope.resources = $resources;
  });
  
  $scope.submit = function() {
    schedule.all('sub_schedules').post($scope.sub_schedule).then(function($sub_schedule) {
      console.log($sub_schedule.id);
      $location.path('/schedules/' + $sub_schedule.schedule_id + '/edit');
    }, function() {
      console.log("Error");
    });
  };
}]);

app.controller('SubScheduleEditController', ['$scope', '$location', '$routeParams', 'Restangular', function($scope, $location, $routeParams, Restangular) {
  var sub_schedule = Restangular.one('schedules', $routeParams.scheduleId).one('sub_schedules', $routeParams.sub_scheduleId);
  
  sub_schedule.get().then(function($sub_schedule) {
    $scope.sub_schedule = $sub_schedule;
  });

  Restangular.all('assets').getList().then(function($resources) {
    $scope.resources = $resources;
  });

  $scope.edit = function() {
    $scope.sub_schedule.put().then(function($sub_schedule) {
      console.log($sub_schedule.id);
      $location.path('/schedules/' + $sub_schedule.schedule_id + '/edit');
    }, function() {
      console.log("Error");
    });
  };
}]);