/**
 * Created by cenkce on 10/2/15.
 */
define('assertion/assertion-concern', function () {
    var AssertionConcern = function(){
    };

        /**
         * @param object anObject1
         * @param object anObject2
         * @param string aMessage
         * @throws Error
         */
        AssertionConcern.prototype.assertArgumentEquals = function (anObject1, anObject2, aMessage) {
            if (anObject1 !== anObject2) {
                throw new Error(aMessage);
            }
        };

        /**
         * @param bool aBoolean
         * @param string aMessage
         * @throws Error
         */
        AssertionConcern.prototype.assertArgumentFalse = function(aBoolean, aMessage) {
            if (aBoolean) {
                throw new Error(aMessage);
            }
        };

        /**
         * @param String aString
         * @param int aMaximum
         * @param String aMessage
         * @throws Error
         */
        AssertionConcern.prototype.assertArgumentLength = function (aString, aMaximum, aMessage) {
            if (!aString || this.getStrLen(aString) > aMaximum) {
                throw new Error(aMessage);
            }
        };

        AssertionConcern.prototype.getStrLen = function(aString) {
            return trim(aString).length;
        };

        /**
         * @param String aString
         * @param int aMinimum
         * @param int aMaximum
         * @param String aMessage
         * @throws Error
         */
        AssertionConcern.prototype.assertArgumentLengthBetween = function(aString, aMinimum, aMaximum, aMessage) {
            var length = this.getStrLen(aString);
            if (length < aMinimum || length > aMaximum) {
                throw new Error(aMessage);
            }
        };

        /**
         * @param string aString
         * @param String aMessage
         * @throws Error
         */
        AssertionConcern.prototype.assertArgumentNotEmpty = function(aString, aMessage) {
            if (aString == null || empty(aString)) {
                throw new Error(aMessage);
            }
        };

        /**
         * @param Object anObject1
         * @param Object anObject2
         * @param String aMessage
         * @throws Error
         */
        AssertionConcern.prototype.assertArgumentNotEquals = function(anObject1, anObject2, aMessage) {
            if (anObject1 === anObject2) {
                throw new Error(aMessage);
            }
        };

        /**
         * @param Object anObject
         * @param String aMessage
         * @throws Error
         */
        AssertionConcern.prototype.assertArgumentNotNull = function(anObject, aMessage) {
            if (anObject == null) {
                throw new Error(aMessage);
            }
        };

        /**
         * @param int aValue
         * @param int aMinimum
         * @param int aMaximum
         * @param String aMessage
         * @throws Error
         */
        AssertionConcern.prototype.assertArgumentRange = function(aValue, aMinimum, aMaximum, aMessage) {
            if (aValue < aMinimum || aValue > aMaximum) {
                throw new Error(aMessage);
            }
        };

        /**
         * @param boolean aBoolean
         * @param String aMessage
         * @throws Error
         */
        AssertionConcern.prototype.assertArgumentTrue = function(aBoolean, aMessage) {
            if (!aBoolean) {
                throw new Error(aMessage);
            }
        };

        /**
         * @param boolean aBoolean
         * @param String aMessage
         * @throws IllegalStateException
         */
        AssertionConcern.prototype.assertStateFalse = function(aBoolean, aMessage) {
            if (aBoolean) {
                throw new Error(aMessage);
            }
        };

        /**
         * @param boolean aBoolean
         * @param String aMessage
         * @throws IllegalStateException
         */
        AssertionConcern.prototype.assertStateTrue = function(aBoolean, aMessage) {
            if (!aBoolean) {
                throw new Error(aMessage);
            }
        };
});