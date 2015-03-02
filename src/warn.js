/**
 * Alerts the user to an issue without causing an error
 */
module.exports = function warn(msg) {
    if (console.warn)
        console.warn(msg);
    else
        console.log(msg);
};