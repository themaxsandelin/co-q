function HelperFunctions() {
	function arraySum(a) {
	  var sum = 0;
	  for (var i = 0; i < a.length; i++) {
	    sum += a[i];
	  }
	  return sum;
	}

	function arrayMean(a) {
	  return arraySum(a) / a.length;
	}

	//Checks if a string is empty, null or undefined
	function stringIsEmpty(str) {
    	return (!str || 0 === str.length);
	}

	  return {
	    arraySum,
	    arrayMean,
	    stringIsEmpty
	  };
	}	

module.exports = HelperFunctions;
