var app = angular.module('schedular-ui', [ 'ngRoute', 'restangular', 'ui.bootstrap', 'checklist-model' ]);

app.config(function(RestangularProvider) {
  RestangularProvider.setBaseUrl('/scheduler-api/');
});

app.run(['Restangular', '$location', 'AuthService', function(Restangular, $location, AuthService) {
  AuthService.requestCurrentUser()

  // if(!AuthService.isAuthenticated())
  //   $location.path('/auth');

  Restangular.setErrorInterceptor(function(response, deferred, responseHandler) {
    if(response.status === 401) {
      $location.path('/auth');
      return false; // error handled
    }
    if(response.status === 500) {
      $location.path('/auth');
      return false;
    }
    return true; // error not handled
  });
}]);
  
app.config(['$routeProvider', function($routeProvider) {
  $routeProvider
    .when('/auth',
      { controller: 'AuthController',   templateUrl: 'partials/auth.html' })

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

app.factory('SubScheduleTitleService', ['$location', function($location) { 
  service = {
    titles: [
      'Aarti',
      'Announcement',
      'Bhakti Nrutya',
      'Break',
      'Break : Breakfast',
      'Break : Dinner',
      'Break : Lunch',
      'Certificate Distribution',
      'Dance/Nrutya',
      'Debate',
      'Dhun - Vishwa shanti, Bapa\'s health & general',
      'Dhun : Main with Chorus',
      'Dhun : Solo',
      'Dhyey Mantra and Viday Shlok',
      'Dip Pragtya',
      'Drama',
      'Duha',
      'Ek Patriya Abhinay',
      'Games',
      'Garba',
      'Goshthi',
      'Group Activity',
      'Group Discussions',
      'Group Puja',
      'Guest Introduction and Welcome',
      'Guest Speech',
      'Indoor Activity',
      'Introduction',
      'Janmangal Namavali Path',
      'Jaynaad',
      'Katha',
      'Katha via  video conference',
      'Kirtan : Chorus',
      'Kirtan : Duate',
      'Kirtan : Duate and chorus',
      'Kirtan : Main and Chorus',
      'Kirtan : Solo',
      'Kirtan Antakshari',
      'Maha pooja',
      'Mantra Pushpanjali',
      'MC',
      'Other',
      'Panel Discussion',
      'Parayan : Balak',
      'Parayan : Balika',
      'Parayan : Vadil',
      'Parayan : video conference',
      'Parayan : Yuvak',
      'Parayan : Yuvati',
      'Prarthana : Chorus',
      'Prarthana : Solo',
      'Prarthana : Main with Chorus',
      'Prathana Nrutya : Duate',
      'Prathana Nrutya : Group',
      'Prathana Nrutya : Solo',
      'Patrika Vanchan',
      'Pravachan',
      'Presentation : Video',
      'Presentation : Photo',
      'Presentation : Power Point',
      'Presentation with Announcement',
      'Prize Ceramony',
      'Pujan vidhi',
      'Q & A',
      'Quiz',
      'Raas',
      'Samuh Puja',
      'Samvad',
      'Shibir introduction',
      'Shlok/Mantra Gaan',
      'Shorya geet',
      'Skit',
      'Special Announcement',
      'Speech',
      'Speech Via Video Conference',
      'Story time',
      'Stuti',
      'Thal Gaan : Main with Chorus',
      'Thal Gaan : Chorus',
      'Vote of thanks',
      'Welcome/Departure Chandlo'
    ]
  }
  return service;
}])

app.factory('AuthService', ['$location', '$http','Restangular', function($location, $http, Restangular) {
  var service = {
    currentUser: null,
    login: function(user) {
      var req = $http.post('/scheduler-api/auth/login', user)
      return req.then(function(response) {
        service.currentUser = response.data;
        return service.isAuthenticated();
      });
    },
    logout: function() {
      $http.get('/scheduler-api/auth/logout').then(function(response) {
        service.currentUser = undefined
        $location.path('/auth');
      });
    },
    isAuthenticated: function() {
      return !!service.currentUser;
    },

    requestCurrentUser: function() {
      if ( service.isAuthenticated() ) {
        return service.currentUser;
      } else {
        return $http.get('/scheduler-api/auth/currentUser').then(function(response) {
          service.currentUser = response.data;
          return service.currentUser;
        });
      }
    }, 

    isUser: function() {
      if(service.isAuthenticated() && service.currentUser.authlevel < 51)
        return true;
      return false;
    },

    isAdmin: function() {
      if(service.isAuthenticated() && service.currentUser.authlevel < 1)
        return true;
      return false;
    }
  };
  return service;
}]);

app.controller('HeaderCtrl', ['$scope', '$location','AuthService', function($scope, $location, AuthService) { 
  $scope.isAuthenticated = AuthService.isAuthenticated;
  $scope.isUser = AuthService.isUser;
  $scope.isAdmin = AuthService.isAdmin;

  $scope.home = function () {
    $location.path('/schedules');
  }
  $scope.logout = function () {
    AuthService.logout();
  }
}]);

app.controller('AuthController', ['$scope', '$location','AuthService', function($scope, $location, AuthService) {
  $scope.validate = function() {
    AuthService.login($scope.auth).then(function(loggedIn) {
        $location.path('/schedules');
    }, function(response) {
      $scope.authError = 'Username or Password does not match.'
    });
  };
}]);

app.controller('ScheduleListController', ['$scope', '$location', 'Restangular', function($scope, $location, Restangular) {
  $scope.isCollapsed = true;
  var schedules = Restangular.all('schedules/upcoming');
  schedules.getList().then(function($schedules) {
    $scope.schedules = $schedules;
  });

  $scope.hidePast = function() {
    $scope.isCollapsed = true;
  }

  $scope.showPast = function() {
    var pastSchedules = Restangular.all('schedules/past');
    pastSchedules.getList().then(function($schedules) {
      $scope.pastSchedules = $schedules;
    });
    $scope.isCollapsed = false;
  }

  $scope.showDetail = function($schedule) {
    $location.path('/schedules/' + $schedule.id);
  }
}]);

app.controller('ScheduleDetailController', ['$scope', '$location', '$routeParams', '$filter','Restangular', 'AuthService', function($scope, $location, $routeParams, $filter, Restangular, AuthService) {
  $scope.isUser = AuthService.isUser;
  $scope.isAdmin = AuthService.isAdmin;
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

app.controller('ScheduleEditController', ['$scope', '$location', '$routeParams', '$filter', 'Restangular', function($scope, $location, $routeParams, $filter, Restangular) {
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
      $location.path('/schedules/' + $schedule.id);
    }, function($schedule) {
      console.log('Error saving schedule');
    });
  }
}]);

app.controller('SubScheduleNewController', ['$scope', '$location', '$routeParams', 'Restangular', 'SubScheduleTitleService', function($scope, $location, $routeParams, Restangular, SubScheduleTitleService) {
  var schedule = Restangular.one('schedules', $routeParams.scheduleId);

  Restangular.all('assets').getList().then(function($resources) {
    $scope.resources = $resources;
  });
  
  $scope.titles = SubScheduleTitleService.titles;

  $scope.submit = function() {
    schedule.all('sub_schedules').post($scope.sub_schedule).then(function($sub_schedule) {
      console.log($sub_schedule.id);
      $location.path('/schedules/' + $sub_schedule.schedule_id + '/edit');
    }, function(response) {
      console.log("Error");
      if(response.status === 400) {
        $scope.error = response.data.error.message;
      }
    });
  };
}]);

app.controller('SubScheduleEditController', ['$scope', '$location', '$routeParams', 'Restangular', 'SubScheduleTitleService', function($scope, $location, $routeParams, Restangular, SubScheduleTitleService) {
  var sub_schedule = Restangular.one('schedules', $routeParams.scheduleId).one('sub_schedules', $routeParams.sub_scheduleId);

  $scope.titles = SubScheduleTitleService.titles;

  sub_schedule.get().then(function($sub_schedule) {
    resources = [];
    angular.forEach($sub_schedule['resources'], function(value, key) {
       this.push(value.id);
     }, resources);
    $sub_schedule['resources'] = resources;
    $scope.sub_schedule = $sub_schedule;
  });

  Restangular.all('assets').getList().then(function($resources) {
    $scope.resources = $resources;
  });

  $scope.edit = function() {
    $scope.sub_schedule.put().then(function($sub_schedule) {
      console.log($sub_schedule.id);
      $location.path('/schedules/' + $sub_schedule.schedule_id + '/edit');
    }, function(response) {
      console.log("Error");
      if(response.status === 400) {
        $scope.error = response.data.error.message;
      }
    });
  };
}]);

// directive that prevents submit if there are still form errors
app.directive('validSubmit', [ '$parse', function($parse) {
  return {
      // we need a form controller to be on the same element as this directive
      // in other words: this directive can only be used on a &lt;form&gt;
      require: 'form',
      // one time action per form
      link: function(scope, element, iAttrs, form) {
        form.$submitted = false;
        // get a hold of the function that handles submission when form is valid
        var fn = $parse(iAttrs.validSubmit);
        
        // register DOM event handler and wire into Angular's lifecycle with scope.$apply
        element.on('submit', function(event) {
          scope.$apply(function() {
            // on submit event, set submitted to true (like the previous trick)
            form.$submitted = true;
            // if form is valid, execute the submission handler function and reset form submission state
            if (form.$valid) {
              fn(scope, { $event : event });
              form.$submitted = false;
            }
          });
        });
      }
    };
  }
]);