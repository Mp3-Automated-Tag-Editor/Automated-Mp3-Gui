export function SongItem({ path, status, percentage, id }: { path: string, status: boolean, percentage: number, id: number }) {
    return (
        <div>
            <p className="line5">[&gt;] Song #{id} <span style={{ color: 'rgb(251, 146, 60)' }}>@{path}</span></p>
            <p className="line5 flex flex-row">Status: {status ?
                <span className="flex flex-row px-2">
                    Processing<div className="loader2"></div>
                </span>
                : <span style={{ color: 'rgb(22, 163, 74)' }}>Done</span>}</p>
            {!status ? <p className="line5">Percentage Accuracy: <span style={
                {
                    color: percentage >= 80 ? 'rgb(22, 163, 74)' :
                        percentage >= 60 && percentage < 80 ? 'yellow' :
                            percentage >= 40 && percentage < 60 ? 'orange' :
                                percentage < 40 ? 'red' : '#fff'
                }
            }>{percentage}%</span></p>
                : null}
        </div>
    );
}