const User = require('../models/users');
const { v4: uuidv4 } = require('uuid');
const { findPositionAndAttach, placeInLeftSideOfTree, placeInRightSideOfTree } = require('../utils/placeInBinaryTree');
const { generateToken, verifyTokenMiddleware } = require('../middlewares/jwt');


// Register user
async function handleRegisterUser(req, res) {
    const { name, email, password, sponsorId } = req.body;

    const count = await User.countDocuments();
    if (count === 0) {
        let generatedSponsorId = uuidv4().slice(0, 10);
        const leftRefferalLink = `${process.env.DOMAIN_URL}/registerLeft?sponsorId=${generatedSponsorId}`;
        const rightRefferalLink = `${process.env.DOMAIN_URL}/registerRight?sponsorId=${generatedSponsorId}`;
        const newUser = new User({
            name,
            email,
            password,
            sponsorId: generatedSponsorId,
            mySponsorId: generatedSponsorId,
            leftRefferalLink,
            rightRefferalLink
        });
        await newUser.save();
        return res.status(201).json({ message: 'First user registered successfully', user: newUser });
    }

    try {
        // Check if the Sponsor ID exists in the database
        const sponsor = await User.findOne({ sponsorId: sponsorId });
        if (!sponsor) {
            return res.status(400).json({ message: 'Invalid Sponsor ID' });
        }

        // Creating sponsorID + leftLink + rightLink + user
        let mySponsorId = uuidv4().slice(0, 10);
        const leftRefferalLink = `${process.env.DOMAIN_URL}/registerLeft?sponsorId=${mySponsorId}`;
        const rightRefferalLink = `${process.env.DOMAIN_URL}/registerRight?sponsorId=${mySponsorId}`;
        const newUser = new User({
            name,
            email,
            password,
            sponsorId,
            mySponsorId,
            leftRefferalLink,
            rightRefferalLink
        });
        await newUser.save();

        // Attach to sponsor's binary tree
        await findPositionAndAttach(sponsor, newUser);
        res.status(201).json({ message: 'User registered successfully', user: newUser });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
}


// Register user using Left link
async function handleRegisterUsingLeftLink(req, res) {
    try {
        const sponsorId = req.query.sponsorId;
        console.log(sponsorId);
        const user = await User.findOne({ mySponsorId: sponsorId });
        if (!user) { return res.status(404).json({ message: 'Incorrect sponsorId' }); }
        console.log(user);
        console.log('user found successfully');


        // Creating new user + sponsorID + leftLink + rightLink
        let mySponsorId = uuidv4().slice(0, 10);
        const leftRefferalLink = `${process.env.DOMAIN_URL}/registerLeft?sponsorId=${mySponsorId}`;
        const rightRefferalLink = `${process.env.DOMAIN_URL}/registerRight?sponsorId=${mySponsorId}`;
        const { name, email, password } = req.body;
        const newUser = new User({
            name,
            email,
            password,
            sponsorId,
            mySponsorId,
            leftRefferalLink,
            rightRefferalLink
        });
        await newUser.save();

        await placeInLeftSideOfTree(user, newUser);
        res.status(201).json({ message: 'User registered successfully', user: newUser });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
}


// Register user using Right link
async function handleRegisterUsingRightLink(req, res) {
    try {
        const sponsorId = req.query.sponsorId;
        const user = await User.findOne({ mySponsorId: sponsorId });
        if (!user) { return res.status(404).json({ message: 'Incorrect sponsorId' }); }

        // Creating new user + sponsorID + leftLink + rightLink
        let mySponsorId = uuidv4().slice(0, 10);
        const leftRefferalLink = `${process.env.DOMAIN_URL}/registerLeft?sponsorId=${mySponsorId}`;
        const rightRefferalLink = `${process.env.DOMAIN_URL}/registerRight?sponsorId=${mySponsorId}`;
        const { name, email, password } = req.body;
        const newUser = new User({
            name,
            email,
            password,
            sponsorId,
            mySponsorId,
            leftRefferalLink,
            rightRefferalLink
        });
        await newUser.save();

        await placeInRightSideOfTree(user, newUser);
        res.status(201).json({ message: 'User registered successfully', user: newUser });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
}


// Login user
async function handleLoginUser(req, res) {
    try {
        const { email, password } = req.body;
        
        
        if (!email || !password) { return res.status(400).json({ message: 'Please provide email and password' }); }

        let user = await User.findOne({ email: email });
        if (!user) { return res.status(404).json({ message: 'User not found' }); }
        

        const isPasswordMatch = await user.comparePassword(password);
        
        if (isPasswordMatch) {
            const payload = { email: user.email, id: user._id, role: 'user' };
            const token = generateToken(payload);
            res.json({ token });
        } else {
            res.status(404).json({ message: 'Incorrect username OR password.' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}





// async function handleShowAllChildren() {
//     try{
//         let user = await User.findOne({ _id: request.params.id});
//         if(!user) { return res.status(404).json({ message: 'Your account not found.' }); }

//         let children = [];
//         await findAllChildren(user, children);
//         res.status(200).json({ans: children});
//     }catch(error) {
//         res.status(500).json({ message: error.message });
//     }
// }



// async function findAllChildren(user, children) {
//     // single user case
//     if (!user.binaryPosition.left && !user.binaryPosition.right) { 
//         return [user]; 
//     }

//     if (user.binaryPosition.leftChild) {
//         const leftChild = await handleShowAllChildren(await User.findById(user.binaryPosition.leftChild));
//         children.push(...leftChild);
//     }

//     if (user.binaryPosition.rightChild) {
//         const rightChild = await handleShowAllChildren(await User.findById(user.rightChild));
//         children.push(rightChild);
//         return children;
//     }
// }




module.exports = {
    handleRegisterUser,
    handleLoginUser,
    handleRegisterUsingLeftLink,
    handleRegisterUsingRightLink
}
