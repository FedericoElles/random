//
// BACKEND 
//

fritzify('rdm') //random decision maker
fritzend.restore() //comment if debugging




//fritzapp.overrideTranslation('de')//debug

fritzapp.translate('en',[
 ['appname','Randomizer for Lists'],
 ['intro','Click on a list to receive a random result based on the configuration.'],
 ['lists','Important decisions'],
 ['createnew','Create new list'],
 ['possibilities','Possibilities'],
 ['enterlistname','Enter list name'],
 ['enterpossibility','Enter possibility name'],
 ['thinking','Thinking...'],
 ['advanced','Advanced options'],
 ['shuffle','Shuffle'],
 ['set','Group'],
 ['setcount','Groups #'],
 ['resultscount','Results per group'],
 ['distributeall','Distribute all (team mode)'],
 ['distributestarred','Distribute starred equaly']
])

fritzapp.translate('de',[
 ['appname','Zufallsgenerator für Listen'],
 ['intro','Klick auf eine Liste um einen Zufallswert zu erhalten basierend auf der Konfiguration.'],
 ['lists','Wichtige Entscheidungen'],
 ['createnew','Neue Liste erstellen'],
 ['possibilities','Optionen'],
 ['enterlistname','Listenname'],
 ['enterpossibility','Bezeichnung der Option'],
 ['thinking','Moment...'],
 ['advanced','Weitere Optionen'],
 ['shuffle','Mischen'],
 ['set','Gruppe'],
 ['setcount','Anzahl Gruppen'],
 ['resultscount','Ergebnisse pro Gruppe'],
 ['distributeall','Alle Werte verteilen (Team Modus)'],
 ['distributestarred','Markierte Werte gleichmäßig verteilen']
])



//
// APPLICATION
//

var app = angular.module('app',['fritzmod']).
  config(function($routeProvider) {
    $routeProvider.
      when('/', {controller:MainCtrl, templateUrl:'main.html'}).
      when('/new/:name', {controller:CreateCtrl, templateUrl:'detail.html'}).
      when('/edit/:id', {controller:EditCtrl, templateUrl:'detail.html'}).
      when('/result', {controller:ResultCtrl, templateUrl:'result.html'}).
      otherwise({redirectTo:'/'});
  });
 
app.config(function($compileProvider){
  $compileProvider.urlSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|tel|javascript):/);
});


//
// MAIN CONTROLLER
//
function MainCtrl($scope, $location, $locale, $timeout, $rootScope,  _app) {
  $scope._t = _app._t
  $scope.lng = _app.lng
  actionbar.setTitle($scope._t.appname)
  actionbar.goHome()

  $scope.items = fritzend.getAll()

  if ($scope.items.length == 0) {
    if (typeof oInitial[$scope.lng] != "undefined") {fritzend.data = oInitial[$scope.lng]}
      else {fritzend.data = oInitial['en']}
    $scope.items = fritzend.getAll()
  }

  for (x in $scope.items){
    $scope.items[x].thinking = false
    $scope.items[x].result = ''
  }

  $scope.changeView = function(_id){
      $location.path('edit/'+_id)
  }

  $scope.rand = function(id){
    var items = this.item.items
    var a = []
    var as = []
    var ii = this.item.returns
    $scope.items[id].result = ''
    for (x in items){
      if (items[x].active){
        if (this.item.distribute){
          if (items[x].star) {
            as.push(items[x])
          } else {
            a.push(items[x])
          }
        } else {
          a.push(items[x])
        }
      }
    }
    
    $rootScope.randResult = {'item':this.item,'a':a,'as':as}
    if (a.length > 0){
      if (this.item.sets == 1){
        $scope.items[id]['thinking'] = true  
        $scope.items[id]['result'] = ''
        $timeout(function(){
          var aResult = []
          var maxStarred = Math.floor(as.length*(ii/(a.length+as.length))) 
          console.log(maxStarred,as.length,ii,a.length)
          
          for (var i=0;i<ii;i+=1) { 
            if (i<maxStarred){
              oneResult = as.splice(Math.floor(Math.random()*as.length),1) 
            }else{
              oneResult = a.splice(Math.floor(Math.random()*a.length),1)
            }

            sName = oneResult[0].name
            if (oneResult[0].star) sName+='*'
            aResult.push(sName)
          }
          $scope.items[id]['result'] = aResult.join(', ')
          $scope.items[id]['thinking'] = false 
        }, 200);
      } else {
        //goto result set view
        $location.path('/result')
      }
       
    }

    
  }
 
}

//
// RESULT CONTROLLER
//
function ResultCtrl($scope, $location, $locale, $timeout, $rootScope,  _app) {
  $scope._t = _app._t
  if (typeof $rootScope.randResult != "undefined"){
    $scope.item = $rootScope.randResult.item
    console.log($scope.result)
    actionbar.goPage('',$scope.item.name)

    //calculation 
    var a = $rootScope.randResult.a.slice(0)
    var as =  $rootScope.randResult.as.slice(0)
    var ii = $scope.item.returns
    if ($scope.item.team)  ii = Math.ceil((a.length+as.length)/$scope.item.sets)
    var maxStarred = Math.floor(as.length*(ii/(a.length+as.length))) 
    //console.log(maxStarred,as.length,ii,a.length)

    $scope.rand = function(){
      a = $rootScope.randResult.a.slice(0)
      as =  $rootScope.randResult.as.slice(0)
      var results = []
      for (var j=0,jj=$scope.item.sets;j<jj;j+=1){
        results[j]=[]
        console.log('Set:',j)
        //for each group
      
        for (var i=0;i<ii;i+=1) { 
          oneResult = false 
          console.log('Item:',i)
          if (i<maxStarred){
            if (as.length>0){
              oneResult = as.splice(Math.floor(Math.random()*as.length),1) 
            }
          }else{
            if (a.length>0){
              oneResult = a.splice(Math.floor(Math.random()*a.length),1)
            }
          }
          if (oneResult){
            sName = oneResult[0].name
            if (oneResult[0].star) sName+='*'
            results[j].push(sName)  
          }
        }
      }
      console.log(results)
      $scope.results= results
    }

    $scope.rand() 
  
  } else {
    $location.path('/')
  }
}

//
// NEW CONTROLLER
// 
function CreateCtrl($scope, $location, $routeParams, $filter,_app) {
  $scope._t = _app._t

  $scope.item = {'name':'','team':false,'returns':1,'sets':1,'distribute':false,items:{}}

  if ($routeParams.name){
    $scope.item.name = $routeParams.name
  }

  actionbar.goPage('',$scope._t['createnew'])

  
  $scope.save = function() {
    var item = fritzend.add($scope.item)
    $location.path('/edit/'+item._id);
   
  }
}
 


 
//
// DETAIL CONTROLLER
// 
function DetailCtrl($scope, $location, $routeParams, $filter, _app) {
  $scope._t = _app._t
  actionbar.goPage('','TITLE')  
  $scope.detail= fritzend.get($routeParams.id)
 

  $scope.$watch('detail', function(newval, oldval) {
      console.log($scope.detail)
      fritzend.update($scope.detail) 
  },false);

}
 
 
function EditCtrl($scope, $location, $routeParams, _app) {
  var self = this;
  $scope._t = _app._t
  $scope.newsubitem = ''
  $scope.item = fritzend.get($routeParams.id)
  $scope.advanced = false
  if ($scope.item.team || $scope.item.sets>1 || $scope.item.returns>1 || $scope.item.distribute) $scope.advanced = true

  actionbar.goPage('',$scope._t['edit'])

  $scope.$watch('item', function(newval, oldval) {
      //restrictings
      console.log(newval)
      iItems = 0 
      for (x in newval.items){if (newval.items[x].active) iItems++} 

      var maxSets = Math.floor(iItems/2)
      var maxReturns = Math.floor(iItems/newval.sets)
      if (newval.sets < 1) $scope.item.sets = 1
      if (newval.sets > maxSets) $scope.item.sets = maxSets
      if (newval.returns< 1) $scope.item.returns= 1
      if (newval.returns> maxReturns ) $scope.item.returns= maxReturns 
      
      //if (newval.sets != oldval.sets || newval.returns != oldval.returns){
      fritzend.update($scope.item) 
      // }
  },true);

  $scope.addItem = function(){
    if ($scope.newsubitem.length > 0){
      var name = $scope.newsubitem
      $scope.item.items[name] = {'name':name,'star':false,'active':true}
      $scope.newsubitem = ''
      fritzend.update($scope.item) 
    }
  }


  $scope.deleteItem = function(name){
    delete $scope.item.items[name]
    fritzend.update($scope.item) 
  }

  
  $scope.isClean = function() {
    return angular.equals(self.original, $scope.item);
  }
 
  $scope.destroy = function() {
    if (confirm($scope._t['reallydelete']+' '+$scope.item .name+'?')){
      fritzend.del($scope.item._id)
      $location.path('/');
    }
    
  };
 
  $scope.save = function() {
    fritzend.update($scope.item) 
    $location.path('/');
  };
}