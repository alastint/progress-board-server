#!/usr/bin/env bash

set -e
set -u
set -o pipefail

# change work directory
parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"

# more bash-friendly output for jq
JQ="jq --raw-output --exit-status"

# global variables
family="progress-bar-server-task-definition-$CIRCLE_BRANCH"
cluster="progress-bar-$CIRCLE_BRANCH"
service="progress-bar-server-service"

makeTaskDefinition() {
	# generate task definition from template
	chmod +x ./task-definition-template.sh && ./task-definition-template.sh

	taskDefinition=$(cat ./taskDefinition.json)
	echo $taskDefinition
}


registerDefinition() {

    if revision=$(aws ecs register-task-definition --container-definitions "$taskDefinition" --family $family | $JQ '.taskDefinition.taskDefinitionArn'); then
        echo "Revision: $revision"
    else
        echo "Failed to register task definition"
        return 1
    fi

}

deployCluster() {

    makeTaskDefinition
    registerDefinition

    if [[ $(aws ecs update-service --cluster $cluster --service $service --task-definition $revision | \
                   $JQ '.service.taskDefinition') != $revision ]]; then
        echo "Error updating service."
        return 1
    fi

    # wait for older revisions to disappear
    for attempt in {1..30}; do
        if stale=$(aws ecs describe-services --cluster $cluster --services $service | \
                       $JQ ".services[0].deployments | .[] | select(.taskDefinition != \"$revision\") | .taskDefinition"); then
            echo "Waiting for stale deployments:"
            echo "$stale"
            sleep 5
        else
            echo "Deployed!"
            return 0
        fi
    done
    echo "Service update took too long."
    return 1
}

deployCluster