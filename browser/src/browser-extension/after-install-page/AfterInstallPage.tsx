import React from 'react'
import LockIcon from 'mdi-react/LockIcon'
import GitHubIcon from 'mdi-react/GitHubIcon'
import GitlabIcon from 'mdi-react/GitlabIcon'
import BitbucketIcon from 'mdi-react/BitbucketIcon'
import BookOpenPageVariantIcon from 'mdi-react/BookOpenPageVariantIcon'
import { PhabricatorIcon } from '../../../../shared/src/components/icons'

export const AfterInstallPage: React.FunctionComponent = () => (
    // TODO: web-content is currently only available in the webapp
    <div className="web-content">
        <div className="container">
            <h1 className="mt-5">Sourcegraph browser extension</h1>
            <p>
                🎉 You’ve just installed the Sourcegraph browser extension!
                <br />
                We’ve gathered the most important information that will get your started:
            </p>
        </div>

        <section className="border-bottom py-5">
            <div className="container">
                <h2>How to use the extension?</h2>
                <div className="row mt-4">
                    <div className="col-sm-6">
                        <h3>Code intelligence on your code host</h3>
                        <p>
                            Sourcegraph browser extension adds code intelligence to files and diffs on GitHub, GitHub
                            Enterprise, GitLab, Phabricator, and Bitbucket Server.
                        </p>
                        <div className="bg-light rounded p-3 w-100 d-flex">Placeholder</div>
                    </div>
                    <div className="col-sm-6">
                        <h3>Search shortcut in the URL location bar</h3>
                        <p>
                            Type <kbd>s</kbd>
                            <kbd>r</kbd>
                            <kbd>c</kbd>
                            <kbd>space</kbd> in the address bar of your browser to search for queries on Sourcegraph.
                        </p>
                        <div className="bg-light rounded p-3 w-100 d-flex">Placeholder</div>
                    </div>
                </div>
            </div>
        </section>

        <section className="border-bottom py-5">
            <div className="container">
                <h2>Make it work on your codehost</h2>
                <div className="row">
                    <div className="col-sm-6">
                        <div className="bg-light rounded p-3">
                            <h3>
                                <GitHubIcon className="icon-inline" /> github.com
                            </h3>
                            <p>No action required. Your extension works here by default.</p>
                        </div>
                        <div className="bg-light rounded p-3">
                            <div className="d-flex justify-content-around flex-wrap">
                                <h3>
                                    <GitlabIcon className="icon-inline" /> GitLab
                                </h3>
                                <h3>
                                    <BitbucketIcon className="icon-inline" /> Bitbucket Server
                                </h3>
                                <h3>
                                    <PhabricatorIcon className="icon-inline" /> Phabricator
                                </h3>
                                <h3>
                                    <GitHubIcon className="icon-inline" /> GitHub Enterprise
                                </h3>
                            </div>
                            <p>Your extension needs explicit permissions to your code host:</p>
                            <ol>
                                <li>Navigate to any page on your code host.</li>
                                <li>
                                    Click the <q>Grant permissions</q> button.
                                </li>
                                <li>
                                    Click <q>Allow</q> in the permissions request popup.
                                </li>
                            </ol>
                        </div>
                    </div>
                    <div className="col-sm-6">
                        <div className="bg-light rounded p-3">Placeholder</div>
                    </div>
                </div>
            </div>
        </section>

        <section className="border-bottom py-5">
            <div className="container">
                <h2>Make it work for private code</h2>
                <div className="row">
                    <div className="col-sm-6">
                        <p>By default, the browser extension works only for public code.</p>
                        <div className="d-flex w-100 align-items-center">
                            <div className="bg-light rounded-circle p-2">
                                <LockIcon className="icon-inline" />
                            </div>
                            <p className="flex-grow-1 m-0 ml-3">
                                To use the browser extension with your private repositories, you need to set up a{' '}
                                <strong>private Sourcegraph instance</strong> and connect the extension to it.
                            </p>
                        </div>
                        <div className="bg-light rounded p-3 mt-4">
                            <p>Follow the instructions:</p>
                            <ol>
                                <li>
                                    <strong>Install Sourcegraph</strong> (
                                    <a href="https://docs.sourcegraph.com/admin/install" target="_blank" rel="noopener">
                                        visit our docs for instructions
                                    </a>
                                    ). Skip this step if you already have a private Sourcegraph instance.
                                </li>
                                <li>
                                    Click the Sourcegraph extension icon in the browser toolbar to open the settings
                                    page.
                                </li>
                                <li>
                                    Enter the <strong>URL</strong> (including the protocol) of your Sourcegraph instance
                                    (such as https://sourcegraph.example.com).
                                </li>
                                <li>Make sure a green checkmark appears in the input field.</li>
                            </ol>
                        </div>
                    </div>
                    <div className="col-sm-6">
                        <div className="bg-light rounded p-3">Placeholder</div>
                    </div>
                </div>
            </div>
        </section>

        <section className="border-bottom py-5">
            <div className="container">
                <h2>Additional resources</h2>
                <div className="d-flex w-100 align-items-center">
                    <div className="bg-light rounded-circle p-2">
                        <BookOpenPageVariantIcon className="icon-inline" />
                    </div>
                    <p className="flex-grow-1 m-0 ml-3">
                        Read <a>the Sourcegraph Documentation</a> to learn more about how we respect your privacy,
                        troubleshooting and extension features.
                    </p>
                </div>
            </div>
        </section>
    </div>
)
