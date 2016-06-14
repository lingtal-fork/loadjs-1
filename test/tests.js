/**
 * loadjs tests
 * @module test/tests.js
 */

var pathsLoaded = null,  // file register
    assert = chai.assert,
    expect = chai.expect;


describe('LoadJS tests', function() {


  beforeEach(function() {
    // reset register
    pathsLoaded = {};
  });


  it('should call success callback on valid path', function(done) {
    loadjs(['assets/file1.js'], {
      success: function() {
        assert.equal(pathsLoaded['file1.js'], true);
        done();
      }
    });
  });


  it('should call fail callback on invalid path', function(done) {
    loadjs(['assets/file-doesntexist.js'], {
      success: function() {
        throw "Executed success callback";
      },
      fail: function(pathsNotFound) {
        assert.equal(pathsNotFound.length, 1);
        assert.equal(pathsNotFound[0], 'assets/file-doesntexist.js');
        done();
      }
    });
  });


  it('should call success callback on two valid paths', function(done) {
    loadjs(['assets/file1.js', 'assets/file2.js'], {
      success: function() {
        assert.equal(pathsLoaded['file1.js'], true);
        assert.equal(pathsLoaded['file2.js'], true);
        done();
      }
    });
  });


  it('should call fail callback on one invalid path', function(done) {
    loadjs(['assets/file1.js', 'assets/file-doesntexist.js'], {
      success: function() {
        throw "Executed success callback";
      },
      fail: function(pathsNotFound) {
        assert.equal(pathsLoaded['file1.js'], true);
        assert.equal(pathsNotFound.length, 1);
        assert.equal(pathsNotFound[0], 'assets/file-doesntexist.js');
        done();
      }
    });
  });


  it('should throw an error if bundle is already defined', function() {
    // define bundle
    loadjs(['assets/file1.js'], 'bundle3');

    // define bundle again
    var fn = function() {
      loadjs(['assets/file1.js'], 'bundle3');
    };

    expect(fn).to.throw(Error, "LoadJS: Bundle already defined");
  });
  

  it('should create a bundle id and a callback inline', function(done) {
    loadjs(['assets/file1.js', 'assets/file2.js'], 'bundle4', {
      success: function() {
        assert.equal(pathsLoaded['file1.js'], true);
        assert.equal(pathsLoaded['file2.js'], true);
        done();
      }
    });
  });


  it('should chain loadjs object', function(done) {
    function bothDone() {
      if (pathsLoaded['file1.js'] && pathsLoaded['file2.js']) done();
    }
    
    // define bundles
    loadjs('assets/file1.js', 'bundle5');
    loadjs('assets/file2.js', 'bundle6');

    loadjs
      .ready('bundle5', {
        success: function() {
          assert.equal(pathsLoaded['file1.js'], true);
          bothDone();
        }})
      .ready('bundle6', {
        success: function() {
          assert.equal(pathsLoaded['file2.js'], true);
          bothDone();
        }
      });
  });


  it('should handle multiple dependencies', function(done) {
    loadjs('assets/file1.js', 'bundle7');
    loadjs('assets/file2.js', 'bundle8');

    loadjs.ready(['bundle7', 'bundle8'], {
      success: function() {
        assert.equal(pathsLoaded['file1.js'], true);
        assert.equal(pathsLoaded['file2.js'], true);
        done();
      }
    });
  });


  it('should fail on missing depdendencies', function(done) {
    loadjs('assets/file1.js', 'bundle9');
    loadjs('assets/file-doesntexist.js', 'bundle10');

    loadjs.ready(['bundle9', 'bundle10'], {
      success: function() {
        throw "Executed success callback";
      },
      fail: function(depsNotFound) {
        assert.equal(pathsLoaded['file1.js'], true);
        assert.equal(depsNotFound.length, 1);
        assert.equal(depsNotFound[0], 'bundle10');
        done();
      }
    });
  });


  it('should execute callbacks on .done()', function(done) {
    // add handler
    loadjs.ready('plugin1', {
      success: function() {
        done();
      }
    });

    // execute done
    loadjs.done('plugin1');
  });


  it('should execute callbacks created after .done()', function(done) {
    // execute done
    loadjs.done('plugin2');

    // add handler
    loadjs.ready('plugin2', {
      success: function() {
        done();
      }
    });
  });


  it('should define bundles', function(done) {
    // define bundle
    loadjs(['assets/file1.js', 'assets/file2.js'], 'bundle1');

    // use 1 second delay to let files load
    setTimeout(function() {
      loadjs.ready('bundle1', {
        success: function() {
          assert.equal(pathsLoaded['file1.js'], true);
          assert.equal(pathsLoaded['file2.js'], true);
          done();
        }
      });
    }, 1000);
  });


  it('should allow bundle callbacks before definitions', function(done) {
    // define callback
    loadjs.ready('bundle2', {
      success: function() {
        assert.equal(pathsLoaded['file1.js'], true);
        assert.equal(pathsLoaded['file2.js'], true);
        done();
      }
    });

    // use 1 second delay
    setTimeout(function() {
      loadjs(['assets/file1.js', 'assets/file2.js'], 'bundle2');
    }, 1000);
  });


  it('should support async false', function(done) {
    var numCompleted = 0,
        numTests = 20,
        paths = ['assets/asyncfalse1.js', 'assets/asyncfalse2.js'];

    // run tests sequentially
    var testFn = function(paths) {
      loadjs(paths, {
        success: function() {
          var f1 = paths[0].replace('assets/', '');
          var f2 = paths[1].replace('assets/', '');

          // check load order
          assert.isTrue(pathsLoaded[f1]);
          assert.isFalse(pathsLoaded[f2]);

          // increment tests
          numCompleted += 1;

          if (numCompleted === numTests) {
            // exit
            done();
          } else {
            // reset register
            pathsLoaded = {};

            // run test again
            paths.reverse();
            testFn(paths);
          }
        },
        async: false
      });
    }

    // run tests
    testFn(paths);
  });


  // Un-'x' this for testing ad blocked scripts.
  //   Ghostery: Disallow "Google Adservices"
  //   AdBlock Plus: Add "www.googletagservices.com/tag/js/gpt.js" as a
  //   custom filter under Options
  //   
  xit('it should report ad blocked scripts as missing', function(done) {
    var blockedScript = 'https://www.googletagservices.com/tag/js/gpt.js';

    loadjs([blockedScript, 'assets/file1.js'], {
      success: function() {
        throw "Executed success callback";
      },
      fail: function(pathsNotFound) {
        assert.equal(pathsLoaded['file1.js'], true);
        assert.equal(pathsNotFound.length, 1);
        assert.equal(pathsNotFound[0], blockedScript);
        done();
      }
    });
  });
});
