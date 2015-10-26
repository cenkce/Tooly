{
        baseUrl: "../",
        out:'../dist/tooly.min.js',
        name:'node_modules/almond/almond',
        optimize: "none",
        deps: [
                //'requireLib',
                'toolyBase/tooly',
                'toolyBase/wordpress/wordpress',
                'toolyBase/wordpress/bbpress',
                'toolyBase/wordpress/widget',
                'toolyBase/bootstrap/modal',
                'toolyBase/assertion/assertion-concern'
                ],
        paths: {
            tooly:'tooly',
            toolyBase:'src/tooly/',
            //requireLib:'node_modules/requirejs/require',
            jquery:'empty:'
        },
        optimizeAllPluginResources: false,
        preserveLicenseComments:false,
        generateSourceMaps: true,
        skipModuleInsertion: true
}