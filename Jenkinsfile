properties([disableConcurrentBuilds()])

node('swarm') {
    def WORKSPACE = pwd()
    def GOPATH = WORKSPACE

    withEnv(["WORKSPACE=${WORKSPACE}", "GOPATH=${GOPATH}"])
    {
        dir("src/github.com/vrenjith/nomad")
        {
            checkout scm
        }
        dir("src/github.com/vrenjith/nomad")
        {
            sh """
            make bootstrap
            make release
            """
        }
    }
}
