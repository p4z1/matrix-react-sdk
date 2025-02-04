/*
Copyright 2019 New Vector Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import React from "react";
import { sortBy } from "lodash";

import { _t } from "../../../../../languageHandler";
import SettingsStore from "../../../../../settings/SettingsStore";
import { SettingLevel } from "../../../../../settings/SettingLevel";
import SdkConfig from "../../../../../SdkConfig";
import BetaCard from "../../../beta/BetaCard";
import SettingsFlag from "../../../elements/SettingsFlag";
import { MatrixClientPeg } from "../../../../../MatrixClientPeg";
import { LabGroup, labGroupNames } from "../../../../../settings/Settings";
import { EnhancedMap } from "../../../../../utils/maps";

interface IState {
    showJumpToDate: boolean;
    showExploringPublicSpaces: boolean;
}

export default class LabsUserSettingsTab extends React.Component<{}, IState> {
    constructor(props: {}) {
        super(props);

        const cli = MatrixClientPeg.get();

        cli.doesServerSupportUnstableFeature("org.matrix.msc3030").then((showJumpToDate) => {
            this.setState({ showJumpToDate });
        });

        cli.doesServerSupportUnstableFeature("org.matrix.msc3827.stable").then((showExploringPublicSpaces) => {
            this.setState({ showExploringPublicSpaces });
        });

        this.state = {
            showJumpToDate: false,
            showExploringPublicSpaces: false,
        };
    }

    public render(): JSX.Element {
        const features = SettingsStore.getFeatureSettingNames();
        const [labs, betas] = features.reduce(
            (arr, f) => {
                arr[SettingsStore.getBetaInfo(f) ? 1 : 0].push(f);
                return arr;
            },
            [[], []] as [string[], string[]],
        );

        let betaSection;
        if (betas.length) {
            betaSection = (
                <div data-testid="labs-beta-section" className="mx_SettingsTab_section">
                    {betas.map((f) => (
                        <BetaCard key={f} featureId={f} />
                    ))}
                </div>
            );
        }

        let labsSections;
        if (SdkConfig.get("show_labs_settings")) {
            const groups = new EnhancedMap<LabGroup, JSX.Element[]>();
            labs.forEach((f) => {
                groups
                    .getOrCreate(SettingsStore.getLabGroup(f), [])
                    .push(<SettingsFlag level={SettingLevel.DEVICE} name={f} key={f} />);
            });

            groups
                .getOrCreate(LabGroup.Experimental, [])
                .push(<SettingsFlag key="lowBandwidth" name="lowBandwidth" level={SettingLevel.DEVICE} />);

            groups
                .getOrCreate(LabGroup.Analytics, [])
                .push(
                    <SettingsFlag
                        key="automaticErrorReporting"
                        name="automaticErrorReporting"
                        level={SettingLevel.DEVICE}
                    />,
                    <SettingsFlag
                        key="automaticDecryptionErrorReporting"
                        name="automaticDecryptionErrorReporting"
                        level={SettingLevel.DEVICE}
                    />,
                );

            if (this.state.showJumpToDate) {
                groups
                    .getOrCreate(LabGroup.Messaging, [])
                    .push(
                        <SettingsFlag
                            key="feature_jump_to_date"
                            name="feature_jump_to_date"
                            level={SettingLevel.DEVICE}
                        />,
                    );
            }

            if (this.state.showExploringPublicSpaces) {
                groups
                    .getOrCreate(LabGroup.Spaces, [])
                    .push(
                        <SettingsFlag
                            key="feature_exploring_public_spaces"
                            name="feature_exploring_public_spaces"
                            level={SettingLevel.DEVICE}
                        />,
                    );
            }

            labsSections = (
                <>
                    {sortBy(Array.from(groups.entries()), "0").map(([group, flags]) => (
                        <div className="mx_SettingsTab_section" key={group} data-testid={`labs-group-${group}`}>
                            <span className="mx_SettingsTab_subheading">{_t(labGroupNames[group])}</span>
                            {flags}
                        </div>
                    ))}
                </>
            );
        }

        return (
            <div className="mx_SettingsTab mx_LabsUserSettingsTab">
                <div className="mx_SettingsTab_heading">{_t("Upcoming features")}</div>
                <div className="mx_SettingsTab_subsectionText">
                    {_t(
                        "What's next for %(brand)s? " +
                            "Labs are the best way to get things early, " +
                            "test out new features and help shape them before they actually launch.",
                        { brand: SdkConfig.get("brand") },
                    )}
                </div>
                {betaSection}
                {labsSections && (
                    <>
                        <div className="mx_SettingsTab_heading">{_t("Early previews")}</div>
                        <div className="mx_SettingsTab_subsectionText">
                            {_t(
                                "Feeling experimental? " +
                                    "Try out our latest ideas in development. " +
                                    "These features are not finalised; " +
                                    "they may be unstable, may change, or may be dropped altogether. " +
                                    "<a>Learn more</a>.",
                                {},
                                {
                                    a: (sub) => {
                                        return (
                                            <a
                                                href="https://github.com/vector-im/element-web/blob/develop/docs/labs.md"
                                                rel="noreferrer noopener"
                                                target="_blank"
                                            >
                                                {sub}
                                            </a>
                                        );
                                    },
                                },
                            )}
                        </div>
                        {labsSections}
                    </>
                )}
            </div>
        );
    }
}
