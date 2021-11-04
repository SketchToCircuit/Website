class UserObject {
    constructor(id) {
        this.id = id; //UserID this.
        this.isAuth = false; //Is user Authenticated this.
        this.google = undefined; //Google token this.
        this.drawVal = undefined; //val or draw or non
        this.count = 0; // How many images have been drawn/validated?
        this.lastDrawId = -1;   // last component_id the user did draw
        this.valImgId = -1;     // image id of currently validation image
        this.drawCmpType = '';  // component type of currently drawing image
    }
}

module.exports = UserObject;