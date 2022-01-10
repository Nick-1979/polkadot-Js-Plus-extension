import { Avatar, Divider, Grid } from "@mui/material";
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import getLogo from "../../util/getLogo";
import { ActionText } from "../../../../extension-ui/src/components";

interface Props {
    chainName: string;
    title: string;
    handleModalClose: any;
    icon?: any;
}
export default function Header({ chainName, title, handleModalClose, icon }: Props): React.ReactElement<Props> {
    const { t } = useTranslation();

    return (
        <>
            <Grid item alignItems='center' container justifyContent='space-between' sx={{ padding: '0px 20px' }}>
                <Grid item>
                    <Avatar
                        alt={'logo'}
                        src={getLogo(chainName)}
                    />
                </Grid>
                <Grid item sx={{ fontSize: 15, fontWeight: 600 }}>
                    {icon} {title}
                </Grid>
                <Grid item sx={{ fontSize: 15 }}>
                    <ActionText
                        onClick={handleModalClose}
                        text={t<string>('Close')}
                    />
                </Grid>
            </Grid>
            <Grid xs={12}>
                <Divider />
            </Grid>
        </>)
}
